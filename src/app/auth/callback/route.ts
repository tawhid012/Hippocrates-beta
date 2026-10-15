import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";
  const persona = requestUrl.searchParams.get("persona");

  // Production origin detection:
  // 1. Explicitly configured public URL environment variable
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""));
  let safeOrigin = envUrl ? envUrl.replace(/\/$/, "") : "";

  if (!safeOrigin) {
    const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host;
    // If x-forwarded-host contains multiple comma-separated proxy hosts, use the first one
    const host = rawHost.split(",")[0].trim();
    const rawProto = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");
    const proto = rawProto.split(",")[0].trim();
    if (host && !host.includes("0.0.0.0")) {
      safeOrigin = `${proto}://${host}`;
    }
  }

  // WebKit / Safari security fix:
  // WebKit strictly blocks 0.0.0.0 as a restricted port (WebKitErrorDomain: 103).
  // Always normalize development origins to http://localhost:3000 or production domain.
  if (!safeOrigin || safeOrigin.includes("0.0.0.0") || !safeOrigin.startsWith("http")) {
    safeOrigin = process.env.NODE_ENV === "production" ? requestUrl.origin : "http://localhost:3000";
  }
  safeOrigin = safeOrigin.replace("0.0.0.0", "localhost");

  const buildSafeRedirectUrl = (pathOrUrl: string, base: string) => {
    let url: URL;
    const baseUrl = new URL(base);
    try {
      if (pathOrUrl.startsWith("/")) {
        url = new URL(pathOrUrl, base);
      } else {
        url = new URL(pathOrUrl.replace("0.0.0.0", "localhost"), base);
        // CRITICAL DEPLOYMENT FIX:
        // If the redirect URL points to localhost/127.0.0.1/0.0.0.0, but the current base
        // is a remote/production domain (e.g. deployed to Vercel/custom domain),
        // rewrite the hostname, port, and protocol to match the production domain!
        if (
          (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "0.0.0.0") &&
          baseUrl.hostname !== "localhost" &&
          baseUrl.hostname !== "127.0.0.1" &&
          baseUrl.hostname !== "0.0.0.0"
        ) {
          url.protocol = baseUrl.protocol;
          url.host = baseUrl.host;
          url.port = baseUrl.port;
        }
      }
    } catch {
      url = new URL("/", base);
    }
    if (url.hostname === "0.0.0.0") {
      url.hostname = "localhost";
    }
    return url;
  };

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore if called from route handler
            }
          },
        },
      });

      const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code);
      const currentUser = sessionData?.session?.user;

      const redirectUrl = buildSafeRedirectUrl(next, safeOrigin);
      if (currentUser?.user_metadata?.role === "patient") {
        // Strict clinical rule: An existing patient account cannot register or switch to doctor
        redirectUrl.searchParams.set("persona", "patient");
        if (persona === "doctor") {
          redirectUrl.searchParams.set("role_restriction", "patient_cannot_be_doctor");
        }
      } else if (persona) {
        redirectUrl.searchParams.set("persona", persona);
      }

      return NextResponse.redirect(redirectUrl);
    }
  }

  const redirectUrl = buildSafeRedirectUrl(next, safeOrigin);
  if (persona) {
    redirectUrl.searchParams.set("persona", persona);
  }

  return NextResponse.redirect(redirectUrl);
}
