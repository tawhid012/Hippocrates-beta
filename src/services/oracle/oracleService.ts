import "server-only";

import { getGeminiClient } from "@/lib/gemini/client";
import { getGeminiCandidateModels } from "@/lib/gemini/config";
import { streamGeminiWithFastFailover } from "@/lib/gemini/fastStream";
import { buildSanitizedGeminiContents } from "@/lib/gemini/contents";
import { getAISettings } from "@/lib/ai/settings";
import { streamOpenAIReply } from "@/lib/ai/openai";
import type { OracleMessage } from "@/lib/ai/provider";
import { ORACLE_SYSTEM_PROMPT } from "./oracleSystemPrompt";

export interface OracleMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

export class OracleServiceError extends Error {
  constructor(public userFacingMessage: string, rawError?: unknown) {
    super(typeof rawError === "string" ? rawError : (rawError as Error)?.message || userFacingMessage);
    this.name = "OracleServiceError";
  }
}

export function getUserFacingOracleError(error: unknown): string {
  if (error instanceof OracleServiceError) {
    return error.userFacingMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Oracle is temporarily unavailable. Please try again.";
}

function buildOracleContents(prompt: string, history: OracleMessageInput[] = []) {
  return buildSanitizedGeminiContents(
    [{ text: prompt.trim() }],
    history.map((m) => ({ role: m.role, content: m.content }))
  );
}

/**
 * Streams clinical responses from Oracle using the active configured provider (OpenAI or Gemini)
 * with robust fallback across candidate models.
 */
export async function* askOracleServiceStream(
  userMessage: string,
  history: OracleMessageInput[] = [],
  apiKey?: string
): AsyncGenerator<string, void, unknown> {
  const prompt = userMessage.trim();
  if (!prompt) {
    throw new OracleServiceError("Please enter a clinical question or case details.");
  }

  // Check active AI settings for multi-provider support
  const settings = await getAISettings().catch(() => null);
  const activeProvider = settings?.activeProvider || "gemini";
  const openaiKey = apiKey?.startsWith("sk-") ? apiKey : settings?.openaiApiKey;

  if (activeProvider === "openai" && openaiKey) {
    try {
      const openAiMessages: OracleMessage[] = [
        { role: "system", content: ORACLE_SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
        { role: "user", content: prompt },
      ];

      for await (const delta of streamOpenAIReply(openAiMessages, openaiKey)) {
        yield delta;
      }
      return;
    } catch (openaiErr) {
      console.warn("[Oracle] OpenAI stream attempt failed, attempting fallback to Gemini:", openaiErr);
    }
  }

  let ai;
  try {
    ai = await getGeminiClient(activeProvider === "gemini" ? apiKey : undefined);
  } catch (err) {
    throw new OracleServiceError("Oracle is not configured. Please set the Gemini or OpenAI API key in the Admin Panel.", err);
  }

  const models = getGeminiCandidateModels();
  const contents = buildOracleContents(prompt, history);

  try {
    for await (const chunk of streamGeminiWithFastFailover(
      ai,
      models,
      {
        contents,
        config: {
          systemInstruction: ORACLE_SYSTEM_PROMPT,
        },
      },
      "[Oracle]"
    )) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
    return;
  } catch (error: unknown) {
    const errStr = String((error as Error)?.message || error);
    if (errStr.includes("API_KEY_INVALID") || errStr.includes("API key not valid") || errStr.includes("MISSING_GEMINI_API_KEY")) {
      throw new OracleServiceError("Oracle API key configuration error. Please check admin settings.", error);
    }
    if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
      throw new OracleServiceError("Oracle is receiving high traffic right now. Please try again shortly.", error);
    }
    throw new OracleServiceError("Oracle is temporarily unavailable. Please try again.", error);
  }
}

/**
 * Executes a clinical query against Oracle and returns the full aggregated response.
 */
export async function askOracleService(
  userMessage: string,
  history: OracleMessageInput[] = [],
  apiKey?: string
): Promise<string> {
  let fullReply = "";
  for await (const delta of askOracleServiceStream(userMessage, history, apiKey)) {
    fullReply += delta;
  }
  if (!fullReply.trim()) {
    throw new OracleServiceError("Oracle did not produce a response. Please try again.");
  }
  return fullReply.trim();
}

