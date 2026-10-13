import "server-only";

import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export const CLIENT_SESSION_COOKIE = "hippocrates_client_session";
export const CLIENT_SESSION_HEADER = "x-consultation-token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "hippocrates-client-session-signing-secret-secure-key"
  );
}

function signSession(id: string): string {
  return createHmac("sha256", getSecretKey()).update(id).digest("hex");
}

function verifySignedToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [id, signature] = parts;
  if (!id || !signature) return null;

  const expected = signSession(id);
  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");

  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;

  return id;
}

/**
 * Retrieves the cryptographic client session ID from request cookies or headers.
 * If none exists, creates a fresh signed session token and sets the cookie.
 */
export async function getClientSessionId(): Promise<string> {
  const headerStore = await headers();
  const tokenHeader = headerStore.get(CLIENT_SESSION_HEADER);
  const validatedFromHeader = verifySignedToken(tokenHeader);
  if (validatedFromHeader) {
    return validatedFromHeader;
  }

  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;
  const validatedFromCookie = verifySignedToken(cookieVal);
  if (validatedFromCookie) {
    return validatedFromCookie;
  }

  // Issue new cryptographic session token
  const newId = randomUUID();
  const newToken = `${newId}.${signSession(newId)}`;

  try {
    cookieStore.set(CLIENT_SESSION_COOKIE, newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
  } catch {
    // In read-only header phases, proceed with generated ID
  }

  return newId;
}

/**
 * Validates whether a given owner token matches the current client's session.
 */
export function isOwner(recordOwnerToken: string | undefined | null, currentSessionId: string): boolean {
  if (!recordOwnerToken || !currentSessionId) return false;
  return recordOwnerToken === currentSessionId;
}

/**
 * Retrieves the currently authenticated Supabase user from server cookies.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;

    // 1. Check Authorization Bearer header first for robust client API requests
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) {
        const { createClient } = await import("@supabase/supabase-js");
        const client = createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const {
          data: { user },
          error,
        } = await client.auth.getUser(token);
        if (!error && user) {
          return user;
        }
      }
    }

    // 2. Check SSR cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Read-only server component context
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

