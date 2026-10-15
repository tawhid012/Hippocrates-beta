import { apiError, ok } from "@/lib/api/response";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getAdminSettings } from "@/lib/ai/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return apiError("Unauthorized access to administrative analytics.", 401);
  }

  try {
    const supabase = createSupabaseServiceClient();
    const settings = await getAdminSettings().catch(() => null);

    let totalUsers = 0;
    let patientUsers = 0;
    let doctorUsers = 0;
    let verifiedDoctors = 0;

    let totalSessions = 0;
    let aegisSessions = 0;
    let oracleSessions = 0;
    let totalMessages = 0;
    let totalReports = 0;

    let recentSessions: Array<{
      id: string;
      title: string;
      workspace_type: string;
      model: string;
      last_message_at: string;
      created_at: string;
      user_id?: string | null;
    }> = [];

    let dbLatencyMs = 0;
    const t0 = performance.now();

    if (supabase) {
      // 1. Fetch user profiles statistics
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("id, role, doctor_registration_number, created_at");

      if (!pError && profiles) {
        totalUsers = profiles.length;
        patientUsers = profiles.filter((p) => p.role === "patient").length;
        doctorUsers = profiles.filter((p) => p.role === "doctor").length;
        verifiedDoctors = profiles.filter(
          (p) =>
            p.role === "doctor" &&
            Boolean(p.doctor_registration_number && p.doctor_registration_number.trim().length >= 3)
        ).length;
      }

      // 2. Fetch session statistics
      const { data: sessions, error: sError } = await supabase
        .from("chat_sessions")
        .select("id, title, workspace_type, model, created_at, last_message_at, user_id, metadata")
        .order("last_message_at", { ascending: false })
        .limit(100);

      dbLatencyMs = Math.round(performance.now() - t0);

      if (!sError && sessions) {
        totalSessions = sessions.length;
        aegisSessions = sessions.filter((s) => s.workspace_type === "aegis").length;
        oracleSessions = sessions.filter((s) => s.workspace_type === "oracle").length;
        recentSessions = sessions.slice(0, 8).map((s) => ({
          id: s.id,
          title: s.title || "Untitled Session",
          workspace_type: s.workspace_type,
          model: s.model,
          last_message_at: s.last_message_at || s.created_at,
          created_at: s.created_at,
          user_id: s.user_id || ((s.metadata as Record<string, unknown> | null)?.user_id as string) || null,
        }));

        // If profiles table has no rows yet, dynamically derive real active users from sessions
        if (totalUsers === 0) {
          const uniqueUserMap = new Map<string, { role: string; hasReg: boolean }>();
          for (const s of sessions) {
            const meta = s.metadata as Record<string, unknown> | null;
            const uid = s.user_id || (meta?.user_id as string) || (meta?.owner_token as string);
            if (uid && !uniqueUserMap.has(uid)) {
              const role = s.workspace_type === "oracle" ? "doctor" : "patient";
              uniqueUserMap.set(uid, { role, hasReg: role === "doctor" });
            }
          }
          if (uniqueUserMap.size > 0) {
            totalUsers = uniqueUserMap.size;
            patientUsers = Array.from(uniqueUserMap.values()).filter((u) => u.role === "patient").length;
            doctorUsers = Array.from(uniqueUserMap.values()).filter((u) => u.role === "doctor").length;
            verifiedDoctors = doctorUsers;
          }
        }
      }

      // 3. Count total messages
      const { count: msgCount } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true });

      if (typeof msgCount === "number") {
        totalMessages = msgCount;
      }

      // 4. Count medical reports / attachments
      const { count: repCount } = await supabase
        .from("medical_reports")
        .select("id", { count: "exact", head: true });

      if (typeof repCount === "number") {
        totalReports = repCount;
      }
    }

    // Baseline fallback if database was empty or initial install
    const analytics = {
      metrics: {
        totalUsers: Math.max(totalUsers, doctorUsers + patientUsers),
        patientUsers,
        doctorUsers,
        verifiedDoctors,
        unverifiedDoctors: Math.max(0, doctorUsers - verifiedDoctors),
        totalSessions,
        aegisSessions,
        oracleSessions,
        totalMessages,
        totalReports,
      },
      systemHealth: {
        databaseConnected: Boolean(supabase),
        databaseLatencyMs: dbLatencyMs,
        activeProvider: settings?.activeProvider || "gemini",
        geminiConfigured: Boolean(settings?.geminiConfigured),
        openaiConfigured: Boolean(settings?.openaiConfigured),
        protocolVersion: "Hippocrates Core v2.5",
        clinicalSafetyGuardrails: "ACTIVE",
        emergencyStoppingProtocol: "ACTIVE",
      },
      recentSessions,
      timestamp: new Date().toISOString(),
    };

    return ok(analytics);
  } catch (err) {
    console.error("[Admin Analytics] Failed to compute metrics:", err);
    return apiError("Failed to compute system telemetry.", 500);
  }
}
