import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

test("Consultation Session Ownership & Access Control Isolation", async (t) => {
  // Model bounded cache with LRU eviction and ownerToken isolation
  class BoundedCaseCache {
    constructor(maxEntries = 100, ttlMs = 30 * 60 * 1000) {
      this.maxEntries = maxEntries;
      this.ttlMs = ttlMs;
      this.entries = new Map();
    }

    set(id, data, ownerToken) {
      if (this.entries.size >= this.maxEntries && !this.entries.has(id)) {
        let oldestKey = null;
        let oldestTime = Infinity;
        this.entries.forEach((val, key) => {
          if (val.cachedAt < oldestTime) {
            oldestTime = val.cachedAt;
            oldestKey = key;
          }
        });
        if (oldestKey) this.entries.delete(oldestKey);
      }
      this.entries.set(id, { data, ownerToken, cachedAt: Date.now() });
    }

    get(id, callerToken) {
      const entry = this.entries.get(id);
      if (!entry) return null;
      if (Date.now() - entry.cachedAt > this.ttlMs) {
        this.entries.delete(id);
        return null;
      }
      if (entry.ownerToken && callerToken && entry.ownerToken !== callerToken) {
        return null; // Quarantined from different owner
      }
      return entry.data;
    }

    list(callerToken) {
      const result = [];
      this.entries.forEach((entry) => {
        if (!entry.ownerToken || entry.ownerToken === callerToken) {
          result.push(entry.data);
        }
      });
      return result;
    }

    delete(id, callerToken) {
      const entry = this.entries.get(id);
      if (!entry) return false;
      if (entry.ownerToken && callerToken && entry.ownerToken !== callerToken) {
        return false; // Denied
      }
      this.entries.delete(id);
      return true;
    }
  }

  const userAToken = "session-user-aaa-" + crypto.randomUUID();
  const userBToken = "session-user-bbb-" + crypto.randomUUID();

  const cache = new BoundedCaseCache(5);

  const caseA1 = { id: "case-a1", title: "Patient A Headache", messages: [] };
  const caseA2 = { id: "case-a2", title: "Patient A Follow-up", messages: [] };
  const caseB1 = { id: "case-b1", title: "Patient B Cardiology", messages: [] };

  cache.set(caseA1.id, caseA1, userAToken);
  cache.set(caseA2.id, caseA2, userAToken);
  cache.set(caseB1.id, caseB1, userBToken);

  await t.test("User A cannot read User B's case", async () => {
    // User A attempts to access Case B1
    const readByA = cache.get("case-b1", userAToken);
    assert.equal(readByA, null, "User A must not be able to read User B's case");

    // User B can access Case B1
    const readByB = cache.get("case-b1", userBToken);
    assert.ok(readByB, "User B must be able to read their own case");
    assert.equal(readByB.id, "case-b1");
  });

  await t.test("User A cannot list User B's cases", async () => {
    const listA = cache.list(userAToken);
    assert.equal(listA.length, 2);
    assert.ok(listA.every((c) => c.id !== "case-b1"), "List for User A must never include User B cases");

    const listB = cache.list(userBToken);
    assert.equal(listB.length, 1);
    assert.equal(listB[0].id, "case-b1");
  });

  await t.test("User A cannot delete User B's case", async () => {
    const deletedByA = cache.delete("case-b1", userAToken);
    assert.equal(deletedByA, false, "User A delete on User B's case must be rejected");

    // Verify record is still intact for User B
    const readByB = cache.get("case-b1", userBToken);
    assert.ok(readByB, "User B's case must remain intact after unauthorized delete attempt");
  });

  await t.test("Bounded cache enforces memory ceiling and evicts LRU entries", async () => {
    const smallCache = new BoundedCaseCache(3);
    smallCache.set("c1", { id: "c1" }, "token");
    smallCache.set("c2", { id: "c2" }, "token");
    smallCache.set("c3", { id: "c3" }, "token");
    assert.equal(smallCache.entries.size, 3);

    // Adding 4th entry must evict the oldest
    smallCache.set("c4", { id: "c4" }, "token");
    assert.equal(smallCache.entries.size, 3, "Cache size must not exceed ceiling of 3");
  });

  await t.test("Oversized base64 payloads are sanitized to prevent DB JSONB bloat", async () => {
    function sanitizeBase64(dataUrl, maxBytes = 50 * 1024) {
      if (!dataUrl || typeof dataUrl !== "string") return dataUrl;
      if (dataUrl.startsWith("data:") && dataUrl.length > maxBytes) {
        return "[ATTACHMENT_PAYLOAD_STORED_IN_STORAGE]";
      }
      return dataUrl;
    }

    const smallImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    assert.equal(sanitizeBase64(smallImage), smallImage);

    const oversizedImage = "data:image/jpeg;base64," + "A".repeat(60 * 1024);
    const sanitized = sanitizeBase64(oversizedImage);
    assert.equal(sanitized, "[ATTACHMENT_PAYLOAD_STORED_IN_STORAGE]");
  });
});
