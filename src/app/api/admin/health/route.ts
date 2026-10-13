import { apiError, ok } from "@/lib/api/response";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getAdminSettings } from "@/lib/ai/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return apiError("Unauthorized access to health telemetry.", 401);
  }

  const t0 = performance.now();
  let dbStatus: "connected" | "error" = "connected";
  let dbLatencyMs = 0;
  let dbError = "";

  try {
    const supabase = createSupabaseServiceClient();
    if (!supabase) {
      dbStatus = "error";
      dbError = "Supabase service client unconfigured.";
    } else {
      const { error } = await supabase.from("app_settings").select("id").limit(1);
      dbLatencyMs = Math.round(performance.now() - t0);
      if (error) {
        dbStatus = "error";
        dbError = error.message;
      }
    }
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : "Database connection failed";
  }

  const settings = await getAdminSettings().catch(() => null);

  const mem = process.memoryUsage();
  const memoryInfo = {
    rssMb: Math.round(mem.rss / 1024 / 1024),
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
  };

  return ok({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      error: dbError || null,
    },
    aiEngine: {
      activeProvider: settings?.activeProvider || "gemini",
      geminiConfigured: Boolean(settings?.geminiConfigured),
      openaiConfigured: Boolean(settings?.openaiConfigured),
      fastStreamingActive: true,
      protocolVersion: "Hippocrates Core v2.5",
    },
    memory: memoryInfo,
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      adminSessionSecurity: "HMAC-SHA256 Protected",
      rateLimiter: "Active",
    },
  });
}
