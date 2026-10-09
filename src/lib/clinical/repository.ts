import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { NormalizedClinicalSummary } from "./types";

class BoundedDocCache {
  private maxItems = 50;
  private ttlMs = 30 * 60 * 1000;
  private entries = new Map<string, { value: NormalizedClinicalSummary; lastAccessed: number }>();

  get(id: string): NormalizedClinicalSummary | undefined {
    const entry = this.entries.get(id);
    if (!entry) return undefined;
    if (Date.now() - entry.lastAccessed > this.ttlMs) {
      this.entries.delete(id);
      return undefined;
    }
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  set(id: string, value: NormalizedClinicalSummary): void {
    if (this.entries.size >= this.maxItems) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      this.entries.forEach((v, k) => {
        if (v.lastAccessed < oldestTime) {
          oldestTime = v.lastAccessed;
          oldestKey = k;
        }
      });
      if (oldestKey) this.entries.delete(oldestKey);
    }
    this.entries.set(id, { value, lastAccessed: Date.now() });
  }
}

const docCache = new BoundedDocCache();

export async function saveClinicalDocument(
  summary: NormalizedClinicalSummary,
  ownerToken?: string
): Promise<void> {
  const documentWithAuth: NormalizedClinicalSummary & { owner_token?: string } = {
    ...summary,
    owner_token: ownerToken,
  };

  docCache.set(summary.documentId, documentWithAuth);

  const supabase = createSupabaseServiceClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from("clinical_documents").insert({
      session_id: summary.conversationId && summary.conversationId.length === 36 ? summary.conversationId : null,
      model: summary.model,
      document_type: "AI_CLINICAL_SUMMARY",
      document_status: summary.status,
      elevenlabs_conversation_id: summary.elevenlabsConversationId || null,
      structured_summary: documentWithAuth as unknown as Record<string, unknown>,
      created_at: summary.generatedAt,
      updated_at: summary.generatedAt,
    } as never);

    if (error) {
      console.warn("Failed to persist clinical document in Supabase:", error.message);
      if (error.message?.includes("foreign key") || (error as { code?: string }).code === "23503") {
        const { error: retryError } = await supabase.from("clinical_documents").insert({
          session_id: null,
          model: summary.model,
          document_type: "AI_CLINICAL_SUMMARY",
          document_status: summary.status,
          elevenlabs_conversation_id: summary.elevenlabsConversationId || null,
          structured_summary: documentWithAuth as unknown as Record<string, unknown>,
          created_at: summary.generatedAt,
          updated_at: summary.generatedAt,
        } as never);
        if (retryError) {
          console.warn("Fallback insertion of clinical document without session_id also failed:", retryError.message);
        }
      }
    }
  } catch (err) {
    console.warn("Error inserting clinical document:", err);
  }
}

export async function getClinicalDocument(
  documentId: string,
  _ownerToken?: string
): Promise<NormalizedClinicalSummary | null> {
  void _ownerToken;
  const cached = docCache.get(documentId);
  if (cached) {
    return cached;
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("clinical_documents")
      .select("structured_summary")
      .eq("structured_summary->>documentId", documentId)
      .maybeSingle();

    if (!error && data && data.structured_summary) {
      const summary = data.structured_summary as unknown as NormalizedClinicalSummary & { owner_token?: string };
      docCache.set(documentId, summary);
      return summary;
    }
  } catch (err) {
    console.warn("Error fetching clinical document:", err);
  }

  return null;
}
