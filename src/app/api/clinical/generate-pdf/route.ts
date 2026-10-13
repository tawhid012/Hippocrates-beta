import { NextRequest, NextResponse } from "next/server";
import { generatePdfBlob } from "@/lib/clinical/generatePdf";
import { getClinicalDocument } from "@/lib/clinical/repository";
import type { NormalizedClinicalSummary } from "@/lib/clinical/types";
import { getClientSessionId, getAuthenticatedUser } from "@/lib/auth/session";
import { getCase } from "@/lib/cases/repository";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sessionId = await getClientSessionId();
    const user = await getAuthenticatedUser();
    const body = await req.json();
    let summary: NormalizedClinicalSummary | null = body.summary || null;

    if (!summary && body.documentId) {
      summary = await getClinicalDocument(body.documentId, sessionId);
    }

    // If summary was supplied in body, verify that the referenced consultation belongs to the session or user
    if (summary && summary.conversationId && summary.conversationId.length === 36) {
      const caseRecord = await getCase(summary.conversationId, undefined, sessionId, user?.id);
      if (!caseRecord) {
        // Fallback: Check if document was saved under current session
        const stored = await getClinicalDocument(summary.documentId, sessionId);
        if (!stored) {
          return NextResponse.json(
            { ok: false, error: "Clinical document not found or access denied." },
            { status: 404 }
          );
        }
      }
    }

    if (!summary) {
      return NextResponse.json(
        { ok: false, error: "Valid clinical summary payload or authorized document ID is required." },
        { status: 404 }
      );
    }

    const pdfBlob = generatePdfBlob(summary);
    const arrayBuffer = await pdfBlob.arrayBuffer();

    const fileName = `Hippocrates_Clinical_Summary_${summary.documentId || "doc"}.pdf`;

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    console.error("Failed to generate clinical PDF:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
