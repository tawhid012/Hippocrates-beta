import { AI_TIMEOUT_MS } from "@/config/ai";
import type { AIProvider, OracleMessage } from "./provider";

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string; type?: string; code?: string };
}

async function openAIRequest(apiKey: string, messages: OracleMessage[], signal: AbortSignal) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.2,
    }),
    signal,
  });

  const data = (await response.json().catch(() => ({}))) as OpenAIChatResponse;

  if (!response.ok) {
    if (response.status === 401) throw new Error("INVALID_API_KEY");
    if (response.status === 429) throw new Error("RATE_LIMIT");
    throw new Error(data.error?.message || "PROVIDER_OFFLINE");
  }

  return data;
}

export const openAIProvider: AIProvider = {
  id: "openai",

  async generateReply(messages, apiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const data = await openAIRequest(apiKey, messages, controller.signal);
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) throw new Error("EMPTY_PROVIDER_RESPONSE");
      return reply;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("TIMEOUT");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },

  async testConnection(apiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    try {
      await openAIRequest(
        apiKey,
        [
          { role: "system", content: "You are Oracle." },
          { role: "user", content: "Reply with ok." },
        ],
        controller.signal
      );
    } finally {
      clearTimeout(timeout);
    }
  },
};

/**
 * Streams chat completions from OpenAI using SSE for real-time Oracle responses.
 */
export async function* streamOpenAIReply(
  messages: OracleMessage[],
  apiKey: string
): AsyncGenerator<string, void, unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.2,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("INVALID_API_KEY");
      if (response.status === 429) throw new Error("RATE_LIMIT");
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } })?.error?.message || "PROVIDER_OFFLINE");
    }

    if (!response.body) throw new Error("No response body received from OpenAI");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const dataStr = trimmed.slice(6).trim();
        if (dataStr === "[DONE]") return;

        try {
          const json = JSON.parse(dataStr) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Ignore partial or unparseable SSE line
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}
