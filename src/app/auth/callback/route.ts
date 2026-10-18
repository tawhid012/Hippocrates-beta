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
  const redirectOriginParam = requestUrl.searchParams.get("redirect_origin");

  // Production origin detection strategy:
  // 1. Explicitly configured public URL environment variable (Vercel, Netlify, Render, Railway, Custom)
  const envUrl =
    process.env.NEXT_PUBLIC_CANONICAL_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "");

  let safeOrigin = envUrl ? envUrl.replace(/\/$/, "") : "";

  // 2. Validate redirect_origin param passed explicitly from client (window.location.origin)
  if (!safeOrigin && redirectOriginParam) {
    try {
      const parsedOrigin = new URL(redirectOriginParam);
      if (
        (parsedOrigin.protocol === "http:" || parsedOrigin.protocol === "https:") &&
        parsedOrigin.hostname !== "0.0.0.0"
      ) {
        safeOrigin = parsedOrigin.origin;
      }
    } catch {
      // Invalid URL in query param, proceed to headers detection
    }
  }

  // 3. Inspect request proxy headers (x-forwarded-host, host, referer)
  if (!safeOrigin) {
    const rawForwardedHost = request.headers.get("x-forwarded-host");
    const rawHost = rawForwardedHost || request.headers.get("host") || requestUrl.host;
    const host = rawHost ? rawHost.split(",")[0].trim() : "";
    const rawProto = request.headers.get("x-forwarded-proto") || (requestUrl.protocol ? requestUrl.protocol.replace(":", "") : "https");
    const proto = rawProto.split(",")[0].trim();

    if (host && !host.includes("0.0.0.0")) {
      // In production mode, if host is localhost/127.0.0.1 (often due to internal standalone container routing),
      // check if referer header contains the real remote domain
      const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
      if (isLocalHost && process.env.NODE_ENV === "production") {
        const referer = request.headers.get("referer");
        if (referer) {
          try {
            const refererUrl = new URL(referer);
            if (!refererUrl.hostname.includes("localhost") && !refererUrl.hostname.includes("127.0.0.1")) {
              safeOrigin = refererUrl.origin;
            }
          } catch {
            // ignore
          }
        }
      }

      if (!safeOrigin) {
        safeOrigin = `${proto}://${host}`;
      }
    }
  }

  // 4. WebKit / Safari security fix & development fallback
  if (!safeOrigin || safeOrigin.includes("0.0.0.0") || !safeOrigin.startsWith("http")) {
    safeOrigin = process.env.NODE_ENV === "production" ? requestUrl.origin : "http://localhost:3000";
  }
  safeOrigin = safeOrigin.replace("0.0.0.0", "localhost");

  // 5. If safeOrigin is still localhost in production, check redirectOriginParam or requestUrl.origin
  if (
    process.env.NODE_ENV === "production" &&
    (safeOrigin.includes("localhost") || safeOrigin.includes("127.0.0.1"))
  ) {
    if (redirectOriginParam && !redirectOriginParam.includes("localhost") && !redirectOriginParam.includes("127.0.0.1")) {
      safeOrigin = redirectOriginParam;
    } else if (requestUrl.hostname !== "localhost" && requestUrl.hostname !== "127.0.0.1") {
      safeOrigin = requestUrl.origin;
    }
  }

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
        // is a remote/production domain (e.g. deployed to Vercel/Netlify/custom domain),
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
    url.searchParams.delete("redirect_origin");
    return url;
  };

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      let pendingCookies: Array<{ name: string; value: string; options?: any }> = [];
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            pendingCookies = cookiesToSet;
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

      const response = NextResponse.redirect(redirectUrl);
      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    }
  }

  const redirectUrl = buildSafeRedirectUrl(next, safeOrigin);
  if (persona) {
    redirectUrl.searchParams.set("persona", persona);
  }

  return NextResponse.redirect(redirectUrl);
}
