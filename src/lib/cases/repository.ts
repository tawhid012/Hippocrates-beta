import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { ChatMessage, ChatAttachment, ReportAnalysisResult } from "@/lib/types";
import type { Json } from "@/lib/supabase/types";

export type WorkspaceType = "oracle" | "aegis";

export interface CaseSummary {
  id: string;
  title: string;
  workspaceType: WorkspaceType;
  model?: string;
  persona?: "doctor" | "patient" | string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  elevenlabsConversationId?: string;
  metadata?: Record<string, unknown>;
}

export interface CaseWithMessages extends CaseSummary {
  messages: ChatMessage[];
}

interface InMemoryCase {
  id: string;
  title: string;
  workspaceType: WorkspaceType;
  model?: string;
  persona?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  elevenlabsConversationId?: string;
  messages: ChatMessage[];
  metadata?: Record<string, unknown>;
}

/**
 * Bounded in-memory LRU cache to prevent memory exhaustion and process leaks.
 * Caps stored cases at 100 entries and purges entries after 30 minutes of inactivity.
 */
class BoundedCaseCache {
  private maxItems = 100;
  private ttlMs = 30 * 60 * 1000;
  private entries = new Map<string, { value: InMemoryCase; lastAccessed: number }>();

  get(id: string): InMemoryCase | undefined {
    const entry = this.entries.get(id);
    if (!entry) return undefined;
    if (Date.now() - entry.lastAccessed > this.ttlMs) {
      this.entries.delete(id);
      return undefined;
    }
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  set(id: string, value: InMemoryCase): void {
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

  delete(id: string): void {
    this.entries.delete(id);
  }

  values(): InMemoryCase[] {
    const now = Date.now();
    const result: InMemoryCase[] = [];
    this.entries.forEach((v, k) => {
      if (now - v.lastAccessed > this.ttlMs) {
        this.entries.delete(k);
      } else {
        result.push(v.value);
      }
    });
    return result;
  }
}

const caseCache = new BoundedCaseCache();

function sanitizeAttachmentForStorage(att?: ChatAttachment): ChatAttachment | undefined {
  if (!att) return undefined;
  // If dataUrl exceeds 50KB, strip the raw inline base64 string from database JSONB
  // to prevent database table bloat and high-latency queries
  const isOversized = att.dataUrl && att.dataUrl.length > 50_000;
  return {
    ...att,
    dataUrl: isOversized ? undefined : att.dataUrl,
  };
}

function toChatMessage(row: {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  metadata?: unknown;
  attachment?: ChatAttachment;
  attachments?: ChatAttachment[];
  reportAnalysis?: ReportAnalysisResult;
  visualAnalysisSummary?: string;
}): ChatMessage {
  const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  return {
    id: row.id,
    role: row.role === "system" ? "assistant" : row.role,
    content: row.content,
    timestamp: new Date(row.created_at),
    attachment: row.attachment || (meta.attachment as ChatAttachment | undefined),
    attachments: row.attachments || (meta.attachments as ChatAttachment[] | undefined),
    reportAnalysis: row.reportAnalysis || (meta.reportAnalysis as ReportAnalysisResult | undefined),
    visualAnalysisSummary: row.visualAnalysisSummary || (meta.visualAnalysisSummary as string | undefined),
  };
}

/**
 * Lists clinical cases scoped strictly to the requesting user ID or session token.
 * Strictly isolates and separates chats between different users.
 */
export async function listCases(
  workspace?: WorkspaceType,
  ownerToken?: string,
  userId?: string
): Promise<CaseSummary[]> {
  // If unauthenticated and no session token, immediately return empty list
  if (!userId && !ownerToken) {
    return [];
  }

  const supabase = createSupabaseServiceClient();
  if (supabase) {
    try {
      let query = supabase
        .from("chat_sessions")
        .select("id, title, workspace_type, model, persona, created_at, updated_at, last_message_at, elevenlabs_conversation_id, metadata, user_id")
        .order("last_message_at", { ascending: false });

      if (workspace) {
        query = query.eq("workspace_type", workspace);
      }

      // STRICT PER-USER CHAT ISOLATION:
      // When a user is logged in, ONLY return sessions created by their specific user_id.
      // Never fall back to ownerToken for logged-in users, preventing cross-user history bleed.
      if (userId) {
        query = query.or(`user_id.eq.${userId},metadata->>user_id.eq.${userId}`);
      } else if (ownerToken) {
        // Unauthenticated visitor only sees unassigned cases with their specific ownerToken
        query = query.contains("metadata", { owner_token: ownerToken });
      }

      const { data, error } = await query;

      if (!error && data) {
        const results = data.map((item) => ({
          id: item.id,
          title: item.title,
          workspaceType: (item.workspace_type as WorkspaceType) || "oracle",
          model: item.model || (workspace === "aegis" ? "aegis-core" : "oracle-core"),
          persona: item.persona || (workspace === "aegis" ? "patient" : "doctor"),
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          lastMessageAt: item.last_message_at || item.updated_at,
          elevenlabsConversationId: item.elevenlabs_conversation_id || undefined,
          metadata: (item.metadata as Record<string, unknown>) || undefined,
        }));

        return results;
      }
    } catch {
      // Fallback to bounded in-memory store
    }
  }

  return caseCache.values()
    .filter((c) => {
      if (workspace && c.workspaceType !== workspace) return false;
      const caseUserId = c.metadata?.user_id || (c as { userId?: string }).userId;
      if (userId) {
        // Strictly only return cases belonging to this exact user
        return caseUserId === userId;
      }
      if (ownerToken) {
        return !caseUserId && c.metadata?.owner_token === ownerToken;
      }
      return false;
    })
    .sort((a, b) => new Date(b.lastMessageAt || b.updatedAt).getTime() - new Date(a.lastMessageAt || a.updatedAt).getTime())
    .map(({ id, title, workspaceType, model, persona, createdAt, updatedAt, lastMessageAt, elevenlabsConversationId, metadata }) => ({
      id,
      title,
      workspaceType,
      model,
      persona,
      createdAt,
      updatedAt,
      lastMessageAt,
      elevenlabsConversationId,
      metadata,
    }));
}

export async function createCase(
  title = "Untitled Session",
  workspace: WorkspaceType = "oracle",
  model?: string,
  persona?: string,
  elevenlabsConversationId?: string,
  predefinedId?: string,
  ownerToken?: string,
  userId?: string
): Promise<CaseSummary> {
  const defaultModel = model || (workspace === "aegis" ? "aegis-core" : "oracle-core");
  const defaultPersona = persona || (workspace === "aegis" ? "patient" : "doctor");

  const id = predefinedId || crypto.randomUUID();
  const now = new Date().toISOString();

  const metadata: Record<string, unknown> = {
    ...(ownerToken ? { owner_token: ownerToken } : {}),
    ...(userId ? { user_id: userId } : {}),
  };

  const newCase: InMemoryCase = {
    id,
    title,
    workspaceType: workspace,
    model: defaultModel,
    persona: defaultPersona,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    elevenlabsConversationId,
    messages: [],
    metadata,
  };
  caseCache.set(id, newCase);

  const summary: CaseSummary = {
    id: newCase.id,
    title: newCase.title,
    workspaceType: newCase.workspaceType,
    model: newCase.model,
    persona: newCase.persona,
    createdAt: newCase.createdAt,
    updatedAt: newCase.updatedAt,
    lastMessageAt: newCase.lastMessageAt,
    elevenlabsConversationId: newCase.elevenlabsConversationId,
    metadata,
  };

  const supabase = createSupabaseServiceClient();
  if (supabase) {
    let { data, error } = await supabase
      .from("chat_sessions")
      .upsert(
        {
          id,
          title,
          workspace_type: workspace,
          model: defaultModel,
          persona: defaultPersona,
          user_id: userId || null,
          elevenlabs_conversation_id: elevenlabsConversationId || null,
          last_message_at: now,
          metadata: metadata as Json,
        },
        { onConflict: "id" }
      )
      .select("id, title, workspace_type, model, persona, created_at, updated_at, last_message_at, elevenlabs_conversation_id, metadata, user_id")
      .single();

    // If RLS blocked setting user_id directly under anon client, fallback to storing in metadata
    if (error && userId) {
      const fallbackRes = await supabase
        .from("chat_sessions")
        .upsert(
          {
            id,
            title,
            workspace_type: workspace,
            model: defaultModel,
            persona: defaultPersona,
            user_id: null,
            elevenlabs_conversation_id: elevenlabsConversationId || null,
            last_message_at: now,
            metadata: metadata as Json,
          },
          { onConflict: "id" }
        )
        .select("id, title, workspace_type, model, persona, created_at, updated_at, last_message_at, elevenlabs_conversation_id, metadata")
        .single();

      if (!fallbackRes.error && fallbackRes.data) {
        data = { ...fallbackRes.data, user_id: userId };
        error = null;
      }
    }

    if (error) {
      console.warn("[Repository] Supabase createCase error, keeping in cache:", error.message);
    }

    if (data) {
      summary.createdAt = data.created_at;
      summary.updatedAt = data.updated_at;
      summary.lastMessageAt = data.last_message_at;
      summary.metadata = (data.metadata as Record<string, unknown>) || undefined;
    }
  }

  return summary;
}

export async function getCase(
  caseId: string,
  workspace?: WorkspaceType,
  ownerToken?: string,
  userId?: string
): Promise<CaseWithMessages | null> {
  // 1. Fast in-memory bounded cache check (<0.1ms) with strict authorization validation
  const cached = caseCache.get(caseId);
  if (cached) {
    let allowed = true;
    if (workspace && cached.workspaceType !== workspace) allowed = false;
    const caseOwnerId = (cached.metadata?.user_id as string | undefined) || (cached as { userId?: string }).userId;
    if (userId) {
      if (!caseOwnerId || caseOwnerId.toLowerCase() !== userId.toLowerCase()) allowed = false;
    } else if (ownerToken) {
      if (caseOwnerId || cached.metadata?.owner_token !== ownerToken) allowed = false;
    } else {
      allowed = false;
    }
    if (allowed) {
      return {
        id: cached.id,
        title: cached.title,
        workspaceType: cached.workspaceType,
        model: cached.model,
        persona: cached.persona,
        createdAt: cached.createdAt,
        updatedAt: cached.updatedAt,
        lastMessageAt: cached.lastMessageAt,
        elevenlabsConversationId: cached.elevenlabsConversationId,
        messages: [...cached.messages],
        metadata: cached.metadata ? { ...cached.metadata } : undefined,
      };
    }
  }

  // 2. Fallback to Supabase database with parallelized queries
  const supabase = createSupabaseServiceClient();
  if (supabase) {
    try {
      let sessionQuery = supabase
        .from("chat_sessions")
        .select("id, title, workspace_type, model, persona, created_at, updated_at, last_message_at, elevenlabs_conversation_id, metadata, user_id")
        .eq("id", caseId);

      if (workspace) {
        sessionQuery = sessionQuery.eq("workspace_type", workspace);
      }

      const messagesQuery = supabase
        .from("chat_messages")
        .select("id, role, content, created_at, metadata")
        .eq("session_id", caseId)
        .order("created_at", { ascending: true });

      const [{ data: session, error: sessionError }, { data: messages, error: messagesError }] =
        await Promise.all([sessionQuery.maybeSingle(), messagesQuery]);

      if (sessionError) {
        console.warn("[Repository] Supabase getCase session query error:", sessionError.message);
      }
      if (messagesError) {
        console.warn("[Repository] Supabase getCase chat_messages error:", messagesError.message);
      }

      if (!sessionError && session) {
        const sessionMeta = (session.metadata && typeof session.metadata === "object" ? session.metadata : {}) as Record<string, unknown>;
        const sessionUserId = (session as { user_id?: string | null }).user_id || (sessionMeta.user_id as string | undefined) || (sessionMeta.userId as string | undefined);

        // Strict ownership check: prevent cross-user case access
        let isAuthorized = false;
        if (userId && sessionUserId) {
          isAuthorized = sessionUserId.toLowerCase() === userId.toLowerCase();
        } else if (ownerToken && !sessionUserId) {
          isAuthorized = sessionMeta.owner_token === ownerToken;
        }

        if (!isAuthorized) {
          return null; // Deny access: only the authenticated owner can access this case
        }

        const parsedMsgs = (!messagesError && messages ? messages : []).map(toChatMessage);
        const caseObj: CaseWithMessages = {
          id: session.id,
          title: session.title,
          workspaceType: (session.workspace_type as WorkspaceType) || "oracle",
          model: session.model,
          persona: session.persona,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
          lastMessageAt: session.last_message_at,
          elevenlabsConversationId: session.elevenlabs_conversation_id || undefined,
          messages: parsedMsgs,
          metadata: {
            ...sessionMeta,
            ...(sessionUserId ? { user_id: sessionUserId } : {}),
            ...(userId ? { user_id: userId } : {}),
          },
        };

        caseCache.set(session.id, { ...caseObj });
        return caseObj;
      }
    } catch (err) {
      console.warn("[Repository] Supabase getCase error, falling back to cache:", err);
    }
  }

  return null;
}

export async function getCaseMetadataOnly(caseId: string, _ownerToken?: string): Promise<Record<string, unknown> | undefined> {
  void _ownerToken;
  const cached = caseCache.get(caseId);
  if (cached && cached.metadata) {
    return cached.metadata;
  }

  const supabase = createSupabaseServiceClient();
  if (supabase) {
    const { data } = await supabase
      .from("chat_sessions")
      .select("metadata")
      .eq("id", caseId)
      .maybeSingle();

    if (data && data.metadata) {
      return data.metadata as Record<string, unknown>;
    }
  }
  return undefined;
}

export async function renameCase(caseId: string, title: string, ownerToken?: string, userId?: string) {
  const existing = await getCase(caseId, undefined, ownerToken, userId);
  if (!existing) {
    throw new Error("Case not found or unauthorized.");
  }

  const newTitle = title.trim() || "Untitled Session";
  const supabase = createSupabaseServiceClient();
  if (supabase) {
    const { error } = await supabase
      .from("chat_sessions")
      .update({ title: newTitle })
      .eq("id", caseId);

    if (error) {
      console.error("[Repository] Supabase rename error:", error);
      throw new Error(`Failed to rename case: ${error.message}`);
    }
  }

  const item = caseCache.get(caseId);
  if (item) {
    item.title = newTitle;
    item.updatedAt = new Date().toISOString();
  }
}

export async function updateCaseMetadata(
  caseId: string,
  metadata: Record<string, unknown>,
  ownerToken?: string,
  userId?: string
) {
  const existing = await getCase(caseId, undefined, ownerToken, userId);
  if (!existing) {
    throw new Error("Case not found or unauthorized.");
  }

  const item = caseCache.get(caseId);
  const currentMeta = item?.metadata || existing.metadata || {};
  const mergedMeta = { ...currentMeta, ...metadata };

  if (item) {
    item.metadata = mergedMeta;
    item.updatedAt = new Date().toISOString();
  }

  const supabase = createSupabaseServiceClient();
  if (supabase) {
    try {
      await supabase
        .from("chat_sessions")
        .update({ metadata: mergedMeta as Json })
        .eq("id", caseId);
    } catch {
      // Fallback
    }
  }
}

export async function deleteCase(caseId: string, ownerToken?: string, userId?: string) {
  const existing = await getCase(caseId, undefined, ownerToken, userId);
  if (!existing) {
    throw new Error("Case not found or unauthorized.");
  }

  const supabase = createSupabaseServiceClient();
  if (supabase) {
    const { error } = await supabase.from("chat_sessions").delete().eq("id", caseId);
    if (error) {
      console.error("[Repository] Supabase delete error:", error);
      throw new Error(`Failed to delete case: ${error.message}`);
    }
  }

  caseCache.delete(caseId);
}

export async function addCaseMessage(
  caseId: string,
  role: "user" | "assistant" | "system",
  content: string,
  extra?: {
    attachment?: ChatAttachment;
    attachments?: ChatAttachment[];
    reportAnalysis?: ReportAnalysisResult;
    visualAnalysisSummary?: string;
  },
  ownerToken?: string,
  userId?: string
) {
  // Sanitize attachment to avoid saving multi-megabyte base64 strings directly in metadata JSONB
  const sanitizedPrimary = sanitizeAttachmentForStorage(extra?.attachment);
  const sanitizedAll = extra?.attachments?.map((a) => sanitizeAttachmentForStorage(a)!);

  const metadataObj = (
    extra
      ? JSON.parse(
          JSON.stringify({
            attachment: sanitizedPrimary,
            attachments: sanitizedAll,
            reportAnalysis: extra.reportAnalysis,
            visualAnalysisSummary: extra.visualAnalysisSummary,
          })
        )
      : {}
  ) as Json;

  let item = caseCache.get(caseId);
  if (!item) {
    const now = new Date().toISOString();
    item = {
      id: caseId,
      title: "Untitled Session",
      workspaceType: "oracle",
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      messages: [],
      metadata: {
        ...(ownerToken ? { owner_token: ownerToken } : {}),
        ...(userId ? { user_id: userId } : {}),
      },
    };
    caseCache.set(caseId, item);
  } else if (userId && !item.metadata?.user_id) {
    item.metadata = { ...(item.metadata || {}), user_id: userId };
  }

  const msgId = crypto.randomUUID();
  const now = new Date();
  const chatMsg: ChatMessage = {
    id: msgId,
    role: role === "system" ? "assistant" : role,
    content,
    timestamp: now,
    attachment: extra?.attachment,
    attachments: extra?.attachments,
    reportAnalysis: extra?.reportAnalysis,
    visualAnalysisSummary: extra?.visualAnalysisSummary,
  };

  item.messages.push(chatMsg);
  item.updatedAt = now.toISOString();
  item.lastMessageAt = now.toISOString();

  const supabase = createSupabaseServiceClient();
  if (supabase) {
    const nowIso = now.toISOString();
    const effectiveUserId = userId || (item?.metadata?.user_id as string | undefined) || null;

    const { error: sessionError } = await supabase
      .from("chat_sessions")
      .upsert(
        {
          id: caseId,
          title: item?.title || "New Health Consultation",
          workspace_type: (item?.workspaceType as WorkspaceType) || "aegis",
          model: item?.model || "aegis-core",
          persona: item?.persona || "patient",
          user_id: effectiveUserId,
          last_message_at: nowIso,
          updated_at: nowIso,
          metadata: (item?.metadata as Json) || {},
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

    if (sessionError) {
      console.warn("[Repository] Supabase session upsert warning:", sessionError.message);
    }

    const { data, error: msgError } = await supabase
      .from("chat_messages")
      .insert({
        id: msgId,
        session_id: caseId,
        user_id: effectiveUserId,
        role,
        content,
        metadata: metadataObj,
      })
      .select("id, role, content, created_at, metadata")
      .single();

    if (msgError) {
      console.warn("[Repository] Supabase message insert warning, kept in memory cache:", msgError.message);
    }

    if (data) {
      await supabase
        .from("chat_sessions")
        .update({
          updated_at: nowIso,
          last_message_at: nowIso,
        })
        .eq("id", caseId);

      return toChatMessage(data);
    }
  }

  return chatMsg;
}

export async function getOracleHistory(caseId: string, ownerToken?: string, userId?: string) {
  const session = await getCase(caseId, "oracle", ownerToken, userId);
  if (!session) return [];
  return session.messages.slice(-20).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

export async function getAegisHistory(caseId: string, ownerToken?: string, userId?: string) {
  const session = await getCase(caseId, "aegis", ownerToken, userId);
  if (!session) return [];
  return session.messages.slice(-20).map((msg) => ({
    role: msg.role,
    content: msg.content,
    attachment: msg.attachment,
    attachments: msg.attachments,
    reportAnalysis: msg.reportAnalysis,
    visualAnalysisSummary: msg.visualAnalysisSummary,
  }));
}
