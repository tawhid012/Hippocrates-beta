import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const ADMIN_COOKIE = "hippocrates_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

// In-memory rate limiting map for login attempts: username -> { count, lockUntil }
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 5 * 60 * 1000; // 5 minutes

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: ADMIN_SESSION_SECRET environment variable is missing in production. Refusing to start insecure session."
      );
    }
    // Development fallback with clear server warning
    console.warn(
      "[Security Warning] ADMIN_SESSION_SECRET is not set. Using ephemeral development secret. Set this variable in .env.local!"
    );
    return "hippocrates-dev-ephemeral-secret-min-32-chars-long";
  }
  if (secret.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET must be at least 16 characters long for cryptographic security.");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function createSessionValue(username: string): string {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ username, expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifySessionValue(value: string | undefined): boolean {
  if (!value) return false;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  try {
    const expected = sign(payload);
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) return false;
    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return false;

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      expiresAt?: number;
    };
    return typeof decoded.expiresAt === "number" && decoded.expiresAt > Date.now();
  } catch {
    return false;
  }
}

/**
 * Checks and records rate limits on login attempts to prevent brute-force attacks.
 */
function checkRateLimit(key: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (attempt) {
    if (attempt.lockUntil > now) {
      const waitMinutes = Math.ceil((attempt.lockUntil - now) / 60000);
      throw new Error(`Too many failed login attempts. Please wait ${waitMinutes} minute(s) before trying again.`);
    }
    if (now > attempt.lockUntil && attempt.lockUntil > 0) {
      // Lock expired, reset
      loginAttempts.delete(key);
    }
  }
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, lockUntil: 0 };
  attempt.count += 1;

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockUntil = now + LOCK_TIME_MS;
    console.warn(`[Security] Admin login locked for '${key}' due to ${attempt.count} failed attempts.`);
  }

  loginAttempts.set(key, attempt);
}

function recordSuccessfulAttempt(key: string): void {
  loginAttempts.delete(key);
}

/**
 * Authenticates administrator credentials with timing-safe checks,
 * rate-limiting, and zero arbitrary-length or prefix bypasses.
 */
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const normUser = username.trim().toLowerCase();
  const trimmedPass = password.trim();

  if (!normUser || !trimmedPass) return false;

  const rateLimitKey = normUser;
  checkRateLimit(rateLimitKey);

  // 1. Check against environment variables
  const envUser = (process.env.ADMIN_USERNAME || "").trim().toLowerCase();
  const envPass = (process.env.ADMIN_PASSWORD || "").trim();

  if (envUser && envPass) {
    const isUserMatch = normUser === envUser;
    const isPassMatch =
      trimmedPass.length === envPass.length &&
      timingSafeEqual(Buffer.from(trimmedPass), Buffer.from(envPass));

    if (isUserMatch && isPassMatch) {
      recordSuccessfulAttempt(rateLimitKey);
      return true;
    }
  }

  // 2. Check Supabase admin_users table (hashed passwords)
  const supabase = createSupabaseServiceClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("username, password_hash")
        .eq("username", normUser)
        .limit(1)
        .maybeSingle();

      if (!error && data && data.password_hash) {
        const matches = await bcrypt.compare(trimmedPass, data.password_hash);
        if (matches) {
          recordSuccessfulAttempt(rateLimitKey);
          return true;
        }
      }
    } catch {
      // Database unavailable or connection error
    }
  }

  // Record failed attempt for rate limiting
  recordFailedAttempt(rateLimitKey);
  return false;
}

export async function createAdminSession(username: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createSessionValue(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE);
  return verifySessionValue(sessionCookie?.value);
}
