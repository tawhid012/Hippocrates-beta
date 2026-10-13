import { apiError, ok } from "@/lib/api/response";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return apiError("Unauthorized access to consultation cases.", 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const workspaceFilter = searchParams.get("workspace") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const supabase = createSupabaseServiceClient();
    if (!supabase) {
      return ok({ cases: [], total: 0 });
    }

    let query = supabase
      .from("chat_sessions")
      .select("id, title, workspace_type, model, persona, created_at, updated_at, last_message_at, user_id, metadata")
      .order("last_message_at", { ascending: false })
      .limit(limit);

    if (workspaceFilter === "aegis" || workspaceFilter === "oracle") {
      query = query.eq("workspace_type", workspaceFilter);
    }

    const { data: sessions, error } = await query;
    if (error || !sessions) {
      return apiError(error?.message || "Failed to query sessions.", 500);
    }

    // Get user names/emails for all session owners
    const userIds = Array.from(new Set(sessions.map((s) => s.user_id).filter(Boolean))) as string[];
    const userMap: Record<string, { name: string; email: string; role: string }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .in("id", userIds);

      if (profiles) {
        for (const p of profiles) {
          userMap[p.id] = {
            name: p.full_name || (p.email ? p.email.split("@")[0] : "User"),
            email: p.email || "",
            role: p.role,
          };
        }
      }
    }

    // Get message counts for these sessions
    const sessionIds = sessions.map((s) => s.id);
    const messageCountMap: Record<string, number> = {};

    if (sessionIds.length > 0) {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("session_id")
        .in("session_id", sessionIds);

      if (msgs) {
        for (const m of msgs) {
          messageCountMap[m.session_id] = (messageCountMap[m.session_id] || 0) + 1;
        }
      }
    }

    let results = sessions.map((s) => {
      const meta = (s.metadata as Record<string, unknown> | null) || {};
      const caseState = (meta.case_state as Record<string, unknown> | undefined) || {};
      const assessmentStatus = (caseState.assessment_status as string) || (meta.assessment_status as string) || "INCOMPLETE";
      const urgencyLevel = (caseState.urgency_level as string) || (meta.urgency_level as string) || "ROUTINE";
      const hasRedFlag = urgencyLevel === "EMERGENCY" || urgencyLevel === "URGENT";

      const owner = s.user_id ? userMap[s.user_id] : null;

      return {
        id: s.id,
        title: s.title || "Untitled Consultation",
        workspaceType: s.workspace_type || "oracle",
        model: s.model || "oracle-core",
        persona: s.persona || "doctor",
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        lastMessageAt: s.last_message_at || s.updated_at,
        userId: s.user_id,
        userName: owner?.name || (s.user_id ? "Authenticated User" : "Anonymous"),
        userEmail: owner?.email || "",
        userRole: owner?.role || s.persona,
        messageCount: messageCountMap[s.id] || 0,
        assessmentStatus,
        urgencyLevel,
        hasRedFlag,
      };
    });

    if (search) {
      results = results.filter((c) => {
        return (
          c.title.toLowerCase().includes(search) ||
          c.id.toLowerCase().includes(search) ||
          c.userName.toLowerCase().includes(search) ||
          c.userEmail.toLowerCase().includes(search)
        );
      });
    }

    return ok({
      cases: results,
      total: results.length,
    });
  } catch (err) {
    console.error("[Admin Cases] Query error:", err);
    return apiError("Failed to fetch clinical consultations.", 500);
  }
}
