import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  normalizePhoneNumber,
  phoneToInternalEmail,
  getPhoneAliasCandidates,
} from "@/lib/auth/phoneUtils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, role, doctorRegistrationNumber, phone } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If Service Role Key is available, use Supabase Admin API to auto-confirm user without email/SMS verification
    if (supabaseUrl && serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
      const cleanPhone = phone ? normalizePhoneNumber(String(phone)) : undefined;
      const userRole = role === "doctor" ? "doctor" : "patient";
      const cleanRegNo = userRole === "doctor" && doctorRegistrationNumber ? String(doctorRegistrationNumber).trim() : null;
      const cleanName = fullName
        ? String(fullName).trim()
        : cleanEmail
        ? cleanEmail.split("@")[0]
        : cleanPhone || "User";

      // The primary account email is either the real email or the phone alias
      const targetEmail = cleanEmail || (cleanPhone ? phoneToInternalEmail(cleanPhone) : undefined);

      if (!targetEmail) {
        return NextResponse.json(
          { ok: false, error: "Please provide a valid email or mobile phone number." },
          { status: 400 }
        );
      }

      // Check if user with this email or phone is already registered in profiles
      if (cleanEmail) {
        const { data: existingEmailProfile } = await adminClient
          .from("profiles")
          .select("id, email")
          .ilike("email", cleanEmail)
          .limit(1);

        if (existingEmailProfile && existingEmailProfile.length > 0) {
          return NextResponse.json(
            {
              ok: false,
              code: "EMAIL_ALREADY_EXISTS",
              error: "An account with this email address is already registered. Please sign in instead.",
            },
            { status: 409 }
          );
        }
      }

      if (cleanPhone) {
        const candidateAliases = getPhoneAliasCandidates(cleanPhone);
        const { data: existingPhoneProfile } = await adminClient
          .from("profiles")
          .select("id, phone, email")
          .or(`phone.eq.${cleanPhone},email.in.(${candidateAliases.map((a) => `"${a}"`).join(",")})`)
          .limit(1);

        if (existingPhoneProfile && existingPhoneProfile.length > 0) {
          return NextResponse.json(
            {
              ok: false,
              code: "PHONE_ALREADY_EXISTS",
              error: "An account with this mobile phone number is already registered. Please sign in instead.",
            },
            { status: 409 }
          );
        }
      }

      // Create user auto-confirmed using targetEmail (bypasses missing SMS provider in Supabase)
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: targetEmail,
        password: String(password),
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          role: userRole,
          doctor_registration_number: cleanRegNo,
          phone: cleanPhone || null,
        },
      });

      if (createError) {
        const errMsg = createError.message || "";
        const isDuplicate =
          errMsg.toLowerCase().includes("already") ||
          errMsg.toLowerCase().includes("exists") ||
          errMsg.toLowerCase().includes("duplicate") ||
          createError.status === 422;

        if (isDuplicate) {
          return NextResponse.json(
            {
              ok: false,
              code: cleanPhone ? "PHONE_ALREADY_EXISTS" : "EMAIL_ALREADY_EXISTS",
              error: cleanPhone
                ? "An account with this mobile phone number is already registered. Please sign in instead."
                : "An account with this email address is already registered. Please sign in instead.",
            },
            { status: 409 }
          );
        }

        return NextResponse.json({ ok: false, error: errMsg }, { status: 400 });
      }

      if (createData.user) {
        // Ensure profile record is immediately created/synced in public.profiles
        try {
          await adminClient.from("profiles").upsert(
            {
              id: createData.user.id,
              email: targetEmail,
              phone: cleanPhone || null,
              full_name: cleanName,
              role: userRole,
              doctor_registration_number: cleanRegNo,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        } catch {
          // Non-blocking
        }

        return NextResponse.json({
          ok: true,
          autoConfirmed: true,
          user: createData.user,
        });
      }
    }

    // If service role key is not configured, inform client to proceed with client-side signup
    return NextResponse.json({ ok: false, fallbackToClient: true });
  } catch (err: unknown) {
    console.error("[Auth Signup API] Error:", err);
    const msg = err instanceof Error ? err.message : "Internal registration error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
