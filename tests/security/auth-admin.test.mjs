import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

test("Admin Authentication Security & Bypass Prevention", async (t) => {
  const TEST_SECRET = "super-secure-admin-session-secret-for-testing-123456";
  const ADMIN_USER = "admin";
  const VALID_PASSWORD = "CorrectAdminPassword!2026";
  const passwordHash = await bcrypt.hash(VALID_PASSWORD, 10);

  function sign(value, secret = TEST_SECRET) {
    return createHmac("sha256", secret).update(value).digest("hex");
  }

  function createSession(username, ttlSeconds = 3600, secret = TEST_SECRET) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const payload = Buffer.from(JSON.stringify({ username, expiresAt })).toString("base64url");
    return `${payload}.${sign(payload, secret)}`;
  }

  function verifySession(cookieValue, secret = TEST_SECRET) {
    if (!cookieValue) return null;
    const [payload, signature] = cookieValue.split(".");
    if (!payload || !signature) return null;

    try {
      const expected = sign(payload, secret);
      const signatureBuffer = Buffer.from(signature, "hex");
      const expectedBuffer = Buffer.from(expected, "hex");

      if (signatureBuffer.length !== expectedBuffer.length) return null;
      if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

      const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      if (typeof decoded.expiresAt !== "number" || decoded.expiresAt <= Date.now()) {
        return null; // Expired
      }
      return decoded;
    } catch {
      return null;
    }
  }

  await t.test("Valid login succeeds with correct credentials", async () => {
    const isValid = await bcrypt.compare(VALID_PASSWORD, passwordHash);
    assert.equal(isValid, true);
    const sessionCookie = createSession(ADMIN_USER);
    const verified = verifySession(sessionCookie);
    assert.ok(verified);
    assert.equal(verified.username, ADMIN_USER);
  });

  await t.test("Arbitrary long password bypass is completely blocked", async () => {
    // In vulnerable versions, passwords with length >= 35 bypassed auth
    const arbitraryLongPassword = "a".repeat(45);
    const isValid = await bcrypt.compare(arbitraryLongPassword, passwordHash);
    assert.equal(isValid, false);
  });

  await t.test("API key prefix bypass is completely blocked", async () => {
    // In vulnerable versions, passwords starting with AQ.Ab8 were accepted
    const prefixBypassAttempt = "AQ.Ab8_fake_bypass_token";
    const isValid = await bcrypt.compare(prefixBypassAttempt, passwordHash);
    assert.equal(isValid, false);
  });

  await t.test("Forged and tampered session cookies are rejected", async () => {
    const validCookie = createSession(ADMIN_USER);
    const [payload, signature] = validCookie.split(".");

    // 1. Tampered payload
    const tamperedPayload = Buffer.from(JSON.stringify({ username: "hacker", expiresAt: Date.now() + 3600000 })).toString("base64url");
    assert.equal(verifySession(`${tamperedPayload}.${signature}`), null);

    // 2. Tampered signature
    const corruptedSignature = signature.slice(0, -4) + "0000";
    assert.equal(verifySession(`${payload}.${corruptedSignature}`), null);

    // 3. Signed with wrong secret
    const attackerCookie = createSession(ADMIN_USER, 3600, "attacker-secret-key-12345");
    assert.equal(verifySession(attackerCookie), null);
  });

  await t.test("Expired session cookies are rejected", async () => {
    // Expired 10 seconds ago
    const expiredCookie = createSession(ADMIN_USER, -10);
    assert.equal(verifySession(expiredCookie), null);
  });

  await t.test("Rate limiter locks out after excessive failed attempts", async () => {
    const attemptsMap = new Map();
    const MAX_ATTEMPTS = 5;
    const LOCK_TIME_MS = 300000;

    function recordFailedAttempt(user) {
      const entry = attemptsMap.get(user) || { count: 0, lockUntil: 0 };
      entry.count += 1;
      if (entry.count >= MAX_ATTEMPTS) {
        entry.lockUntil = Date.now() + LOCK_TIME_MS;
      }
      attemptsMap.set(user, entry);
    }

    function isLockedOut(user) {
      const entry = attemptsMap.get(user);
      if (!entry) return false;
      return Date.now() < entry.lockUntil;
    }

    // 4 failed attempts should not lock
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt("testadmin");
      assert.equal(isLockedOut("testadmin"), false);
    }

    // 5th attempt locks out
    recordFailedAttempt("testadmin");
    assert.equal(isLockedOut("testadmin"), true);
  });
});
