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

  // WebKit / Safari security fix:
  // WebKit strictly blocks 0.0.0.0 as a restricted port (WebKitErrorDomain: 103).
  // Always normalize development origins to http://localhost:3000 or production domain.
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host;
  const proto = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");
  let safeOrigin = `${proto}://${host}`;
  if (safeOrigin.includes("0.0.0.0") || !safeOrigin.startsWith("http")) {
    safeOrigin = "http://localhost:3000";
  }
  safeOrigin = safeOrigin.replace("0.0.0.0", "localhost");

  const buildSafeRedirectUrl = (pathOrUrl: string, base: string) => {
    let url: URL;
    try {
      if (pathOrUrl.startsWith("/")) {
        url = new URL(pathOrUrl, base);
      } else {
        url = new URL(pathOrUrl.replace("0.0.0.0", "localhost"), base);
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
