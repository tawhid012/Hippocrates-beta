import { NextRequest, NextResponse } from "next/server";
import { generateClinicalSummary } from "@/lib/clinical/generateClinicalSummary";
import { saveClinicalDocument } from "@/lib/clinical/repository";
import type { ModelType } from "@/lib/clinical/types";
import { getClientSessionId } from "@/lib/auth/session";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const sessionId = await getClientSessionId();
    const body = await req.json();
    const {
      conversationId = crypto.randomUUID(),
      model = "Aegis Core",
      messages = [],
      transcript,
      elevenlabsConversationId,
      patientInfo,
      caseState,
    } = body;

    const finalConversationId =
      typeof conversationId === "string" && conversationId.trim().length > 0
        ? conversationId.trim()
        : crypto.randomUUID();

    let resolvedMessages = messages;

    // Deterministic encounter history retrieval from Supabase to preserve complete consultation
    if (finalConversationId) {
      try {
        const supabase = createSupabaseServiceClient();
        if (supabase) {
          const { data: dbMessages } = await supabase
            .from("chat_messages")
            .select("id, role, content, metadata, created_at")
            .eq("session_id", finalConversationId)
            .order("created_at", { ascending: true });

          if (dbMessages && dbMessages.length > 0) {
            // If DB messages exist and provide a fuller or equal history, use DB as source of truth
            if (dbMessages.length >= resolvedMessages.length) {
              resolvedMessages = dbMessages.map((m) => {
                const meta = (m.metadata as Record<string, unknown>) || {};
                return {
                  role: m.role,
                  content: m.content,
                  attachment: meta.attachment,
                  attachments: meta.attachments,
                  reportAnalysis: meta.reportAnalysis || meta.report_analysis,
                  visualAnalysisSummary: (meta.visualAnalysisSummary || meta.visual_analysis_summary) as string | undefined,
                };
              });
            }
          }
        }
      } catch (dbErr) {
        console.warn("[GenerateSummary] Non-critical DB history retrieval fallback:", dbErr);
      }
    }

    const summary = await generateClinicalSummary({
      conversationId: finalConversationId,
      model: model as ModelType,
      messages: resolvedMessages,
      transcript,
      elevenlabsConversationId,
      patientInfo,
      caseState,
    });

    // Save in repository / Supabase scoped to client session
    await saveClinicalDocument(summary, sessionId);

    return NextResponse.json({
      ok: true,
      summary,
    });
  } catch (err: unknown) {
    console.error("Failed to generate clinical summary:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
