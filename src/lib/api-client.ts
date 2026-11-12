/**
 * Provider-agnostic frontend API layer.
 *
 * The browser only talks to Hippocrates API routes. It never calls provider
 * APIs directly and never receives provider names from chat responses.
 */

import type { CaseSummary, CaseWithMessages, ChatAttachmentPayload, ChatRequest, ChatResponse } from "./types";
import { createBrowserSupabaseClient } from "./supabase/client";

export function getResolvedApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  return "/api";
}

export function resolveApiUrl(path: string): string {
  const base = getResolvedApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith("/api/")) {
    return `${base}${cleanPath.replace(/^\/api/, "")}`;
  }
  return `${base}${cleanPath}`;
}

const API_BASE_URL = getResolvedApiBaseUrl();

interface ApiErrorBody {
  error?: string;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const cloned = response.clone();
    const data = (await cloned.json().catch(() => null)) as ApiErrorBody | null;
    if (data && typeof data === "object" && typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
  } catch {
    // ignore json parse errors
  }

  // Handle specific HTTP status codes with informative, actionable explanations
  if (response.status === 413) {
    return "The uploaded image or message payload is too large. Please select a smaller photo or take a new one.";
  }
  if (response.status === 504) {
    return "The clinical AI engine took too long to complete the request (timeout). Please try asking again.";
  }
  if (response.status === 429) {
    return "Too many requests or daily AI quota reached. Please wait a moment before sending another message.";
  }
  if (response.status === 401 || response.status === 403) {
    return "Authentication required or session expired. Please refresh your browser.";
  }

  try {
    const text = await response.text();
    if (text && text.length < 200 && !text.includes("<html") && !text.includes("<!DOCTYPE")) {
      return text.trim();
    }
  } catch {
    // ignore
  }

  return `Server returned an error (${response.status} ${response.statusText || "Error"}). Please try again.`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorMsg = await extractErrorMessage(response);
    throw new Error(errorMsg);
  }
  const body = (await response.json().catch(() => ({}))) as T;
  return body;
}

function sanitizeAttachmentForWire(att?: ChatAttachmentPayload): Partial<ChatAttachmentPayload> | undefined {
  if (!att) return undefined;
  return {
    fileName: att.fileName,
    mimeType: att.mimeType,
    fileSize: att.fileSize,
    fileBase64: att.fileBase64,
    attachmentType: att.attachmentType,
    // Exclude redundant dataUrl to cut HTTP body payload in half
  };
}

function sanitizeHistoryForWire(
  history?: Array<{ role: string; content: string; attachment?: unknown; attachments?: unknown }>
) {
  if (!history || !Array.isArray(history)) return undefined;
  return history.map((m) => ({
    role: m.role,
    content: m.content || "",
    // Strictly strip base64 attachments from prior conversation turns
  }));
}

function reviveChatResponse(response: ChatResponse): ChatResponse {
  return {
    ...response,
    messages: response.messages
      ? {
          user: {
            ...response.messages.user,
            timestamp: new Date(response.messages.user.timestamp),
          },
          assistant: {
            ...response.messages.assistant,
            timestamp: new Date(response.messages.assistant.timestamp),
          },
        }
      : undefined,
  };
}

function reviveCase(caseRecord: CaseWithMessages): CaseWithMessages {
  if (!caseRecord) return caseRecord;
  return {
    ...caseRecord,
    messages: (caseRecord.messages || []).map((message) => ({
      ...message,
      timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
    })),
  };
}

export interface StreamCallbacks {
  onInit?: (data: { caseId: string }) => void;
  onDelta?: (delta: string) => void;
  onDone?: (response: ChatResponse) => void;
  onError?: (error: Error) => void;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const client = createBrowserSupabaseClient();
    if (client) {
      // 2000ms guard to ensure network stalls during Supabase token refresh never freeze the UI
      const sessionPromise = client.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 2000)
      );
      const res = await Promise.race([sessionPromise, timeoutPromise]);
      const session = res?.data?.session;
      if (session?.access_token) {
        return {
          Authorization: `Bearer ${session.access_token}`,
          "x-user-id": session.user.id,
        };
      }
    }
  } catch {
    // fallback
  }
  return {};
}

class HippocratesAPI {
  constructor(private readonly baseUrl: string = API_BASE_URL) {}

  async sendMessageStream(request: ChatRequest, callbacks: StreamCallbacks): Promise<void> {
    const isAegis = request.model.startsWith("aegis") || request.persona === "patient";
    const endpoint = isAegis ? `${this.baseUrl}/aegis/chat` : `${this.baseUrl}/oracle/chat`;

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...authHeaders,
        },
        body: JSON.stringify({
          message: request.message,
          caseId: request.caseId,
          attachment: sanitizeAttachmentForWire(request.attachment),
          attachments: request.attachments?.map((a) => sanitizeAttachmentForWire(a)!),
          attachmentType: request.attachmentType,
          history: sanitizeHistoryForWire(request.history as Array<{ role: string; content: string }>),
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorMsg = await extractErrorMessage(response);
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error("No response body received from server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          if (!block.trim()) continue;

          let event = "message";
          let dataStr = "";

          for (const line of block.split("\n")) {
            if (line.startsWith("event: ")) {
              event = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.slice(6).trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (event === "init") {
              callbacks.onInit?.(data);
            } else if (event === "delta") {
              if (data.text) callbacks.onDelta?.(data.text);
            } else if (event === "done") {
              const revived = reviveChatResponse(data as ChatResponse);
              callbacks.onDone?.(revived);
            } else if (event === "error") {
              throw new Error(data.error || "An error occurred during response generation.");
            }
          } catch (jsonErr) {
            if (event === "error") throw jsonErr;
            // Ignore corrupted SSE fragments
          }
        }
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      callbacks.onError?.(errorObj);
      throw errorObj;
    }
  }

  async ask(request: ChatRequest): Promise<ChatResponse> {
    const isAegis = request.model.startsWith("aegis") || request.persona === "patient";
    const endpoint = isAegis ? `${this.baseUrl}/aegis/chat` : `${this.baseUrl}/oracle/chat`;

    const authHeaders = await getAuthHeaders();
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        message: request.message,
        caseId: request.caseId,
        attachment: sanitizeAttachmentForWire(request.attachment),
        attachments: request.attachments?.map((a) => sanitizeAttachmentForWire(a)!),
        attachmentType: request.attachmentType,
        history: sanitizeHistoryForWire(request.history as Array<{ role: string; content: string }>),
        stream: false,
      }),
    });

    return reviveChatResponse(await parseResponse<ChatResponse>(response));
  }

  async listCases(workspace?: "oracle" | "aegis"): Promise<CaseSummary[]> {
    const authHeaders = await getAuthHeaders();
    const url = workspace
      ? `${this.baseUrl}/cases?workspace=${encodeURIComponent(workspace)}`
      : `${this.baseUrl}/cases`;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller?.signal,
        headers: {
          ...authHeaders,
        },
      });
      const body = await parseResponse<{ cases: CaseSummary[] }>(response);
      return body.cases || [];
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async createCase(title?: string, workspace: "oracle" | "aegis" = "oracle"): Promise<CaseSummary> {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/cases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ title, workspace }),
    });
    const body = await parseResponse<{ case: CaseSummary }>(response);
    return body.case;
  }

  async getCase(caseId: string): Promise<CaseWithMessages> {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/cases/${caseId}`, {
      cache: "no-store",
      headers: {
        ...authHeaders,
      },
    });
    const body = await parseResponse<{ case: CaseWithMessages }>(response);
    return reviveCase(body.case);
  }

  async renameCase(caseId: string, title: string): Promise<void> {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/cases/${caseId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ title }),
    });
    await parseResponse<{ success: true }>(response);
  }

  async deleteCase(caseId: string): Promise<void> {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/cases/${caseId}`, {
      method: "DELETE",
      headers: {
        ...authHeaders,
      },
    });
    await parseResponse<{ success: true }>(response);
  }
}

export const api = new HippocratesAPI();
