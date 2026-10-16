/**
 * Provider-agnostic frontend API layer.
 *
 * The browser only talks to Hippocrates API routes. It never calls provider
 * APIs directly and never receives provider names from chat responses.
 */

import type { CaseSummary, CaseWithMessages, ChatRequest, ChatResponse } from "./types";
import { createBrowserSupabaseClient } from "./supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

interface ApiErrorBody {
  error?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) {
    throw new Error(body.error || "Hippocrates could not complete the request.");
  }
  return body;
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
      const {
        data: { session },
      } = await client.auth.getSession();
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
          attachment: request.attachment,
          attachments: request.attachments,
          attachmentType: request.attachmentType,
          history: request.history,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Hippocrates could not complete the request.");
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
        attachment: request.attachment,
        attachments: request.attachments,
        attachmentType: request.attachmentType,
        history: request.history,
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
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        ...authHeaders,
      },
    });
    const body = await parseResponse<{ cases: CaseSummary[] }>(response);
    return body.cases;
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
