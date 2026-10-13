import "server-only";
import type { GoogleGenAI } from "@google/genai";
import { getGeminiCandidateModels } from "./config";

// In-memory model circuit breaker with cooldown timestamps
const modelCooldowns = new Map<string, number>();

// If a model cannot produce a single token within 2200ms, Google is likely throttling or queueing it
const FIRST_TOKEN_TIMEOUT_MS = 2200;
const COOLDOWN_DURATION_MS = 180_000; // 3 minutes

export function markModelCooldown(model: string, durationMs = COOLDOWN_DURATION_MS) {
  modelCooldowns.set(model, Date.now() + durationMs);
}

export function isModelInCooldown(model: string): boolean {
  const expiresAt = modelCooldowns.get(model);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    modelCooldowns.delete(model);
    return false;
  }
  return true;
}

export function getAvailableCandidateModels(candidateModels?: string[]): string[] {
  const all = candidateModels || getGeminiCandidateModels();
  const available: string[] = [];
  const cooledDown: string[] = [];

  for (const m of all) {
    if (isModelInCooldown(m)) {
      cooledDown.push(m);
    } else {
      available.push(m);
    }
  }

  // Active un-throttled models first, followed by cooling models as last resort
  return [...available, ...cooledDown];
}

export interface StreamParams {
  contents: unknown;
  config?: unknown;
}

/**
 * Ultra-low latency streaming generator:
 * 1. Skips known throttled/503 models via the cooldown circuit breaker.
 * 2. Implements a 2200ms TTFT guard to fail over instantly if Google queues a model.
 * 3. Delivers first token to the client in sub-second milliseconds.
 */
export async function* streamGeminiWithFastFailover(
  ai: GoogleGenAI,
  models: string[],
  params: StreamParams,
  logPrefix = "[FastStream]"
): AsyncGenerator<{ text?: string }, void, unknown> {
  const prioritizedModels = getAvailableCandidateModels(models);
  let lastError: unknown = null;

  for (const model of prioritizedModels) {
    let yieldedAny = false;
    const t0 = Date.now();

    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: params.contents as never,
        config: params.config as never,
      });

      const iterator = responseStream[Symbol.asyncIterator]();

      // Race first token against timeout to detect slow/overloaded models instantly
      const firstChunkResult = await Promise.race([
        iterator.next(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Model ${model} TTFT timeout (exceeded ${FIRST_TOKEN_TIMEOUT_MS}ms)`)),
            FIRST_TOKEN_TIMEOUT_MS
          )
        ),
      ]);

      if (firstChunkResult.done) {
        return;
      }

      yieldedAny = true;
      yield firstChunkResult.value;

      // Model successfully produced a token — clear cooldown
      modelCooldowns.delete(model);

      // Stream the remaining tokens without artificial delays
      while (true) {
        const nextResult = await iterator.next();
        if (nextResult.done) break;
        yield nextResult.value;
      }

      return;
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);

      // If tokens were already sent to client, rethrow to prevent corrupt stream
      if (yieldedAny) {
        throw err;
      }

      // Mark model on cooldown so subsequent chat turns don't block
      markModelCooldown(model);
      console.warn(`${logPrefix} Model ${model} failed after ${Date.now() - t0}ms, set cooldown:`, errMsg);
    }
  }

  throw lastError || new Error("All candidate models failed to generate content.");
}
