import { apiError, ok, parseJsonError } from "@/lib/api/response";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return apiError("Unauthorized access to user administration.", 401);
  }

  const { id } = await context.params;
  if (!id) return apiError("Missing user ID.", 400);

  let body: {
    doctorRegistrationNumber?: string;
    role?: "doctor" | "patient";
    fullName?: string;
    isVerified?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return parseJsonError();
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return apiError("Database service unavailable.", 503);
  }

  try {
    const updates: {
      doctor_registration_number?: string | null;
      role?: "doctor" | "patient";
      full_name?: string;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (body.doctorRegistrationNumber !== undefined) {
      updates.doctor_registration_number = body.doctorRegistrationNumber.trim() || null;
    }

    if (body.isVerified !== undefined) {
      if (body.isVerified === false) {
        // Revoke verification: clear doctor registration number
        updates.doctor_registration_number = null;
      } else if (!updates.doctor_registration_number) {
        // Admin manually verified without providing a reg no: mark with an admin-verified token
        updates.doctor_registration_number = `ADMIN-VERIFIED-${Date.now().toString(36).toUpperCase()}`;
      }
    }

    if (body.role === "doctor" || body.role === "patient") {
      updates.role = body.role;
    }

    if (typeof body.fullName === "string" && body.fullName.trim()) {
      updates.full_name = body.fullName.trim();
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return apiError(error.message, 500);
    }

    return ok({ user: data, success: true });
  } catch (err) {
    console.error("[Admin Users PATCH] Update error:", err);
    return apiError("Failed to update user profile.", 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return apiError("Unauthorized access to user administration.", 401);
  }

  const { id } = await context.params;
  if (!id) return apiError("Missing user ID.", 400);

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return apiError("Database service unavailable.", 503);
  }

  try {
    // Delete profile (cascades or delete sessions)
    await supabase.from("chat_sessions").delete().eq("user_id", id);
    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      return apiError(error.message, 500);
    }

    return ok({ success: true });
  } catch (err) {
    console.error("[Admin Users DELETE] Error:", err);
    return apiError("Failed to delete user profile.", 500);
  }
}
