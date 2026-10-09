import { NextRequest, NextResponse } from "next/server";
import { generateClinicalSummary } from "@/lib/clinical/generateClinicalSummary";
import { saveClinicalDocument } from "@/lib/clinical/repository";
import type { ModelType } from "@/lib/clinical/types";
import { getClientSessionId } from "@/lib/auth/session";

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

    const summary = await generateClinicalSummary({
      conversationId: finalConversationId,
      model: model as ModelType,
      messages,
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
