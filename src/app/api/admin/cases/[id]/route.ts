import { apiError, ok } from "@/lib/api/response";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return apiError("Unauthorized access to consultation inspection.", 401);
  }

  const { id } = await context.params;
  if (!id) return apiError("Missing case ID.", 400);

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return apiError("Database service unavailable.", 503);
  }

  try {
    const { data: session, error: sError } = await supabase
      .from("chat_sessions")
      .select("id, title, workspace_type, model, persona, created_at, updated_at, last_message_at, user_id, metadata")
      .eq("id", id)
      .maybeSingle();

    if (sError || !session) {
      return apiError("Case not found.", 404);
    }

    // Fetch messages for this session
    const { data: messages, error: mError } = await supabase
      .from("chat_messages")
      .select("id, role, content, status, created_at, metadata")
      .eq("session_id", id)
      .order("created_at", { ascending: true });

    if (mError) {
      return apiError("Failed to fetch messages for consultation.", 500);
    }

    // Fetch user profile if user_id present
    let userProfile = null;
    if (session.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, doctor_registration_number")
        .eq("id", session.user_id)
        .maybeSingle();
      userProfile = profile;
    }

    return ok({
      case: {
        ...session,
        user: userProfile,
        messages: messages || [],
      },
    });
  } catch (err) {
    console.error("[Admin Case Detail] Error:", err);
    return apiError("Failed to fetch consultation details.", 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return apiError("Unauthorized access to consultation inspection.", 401);
  }

  const { id } = await context.params;
  if (!id) return apiError("Missing case ID.", 400);

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return apiError("Database service unavailable.", 503);
  }

  try {
    await supabase.from("chat_messages").delete().eq("session_id", id);
    const { error } = await supabase.from("chat_sessions").delete().eq("id", id);

    if (error) {
      return apiError(error.message, 500);
    }

    return ok({ success: true });
  } catch (err) {
    console.error("[Admin Case Delete] Error:", err);
    return apiError("Failed to delete case.", 500);
  }
}
