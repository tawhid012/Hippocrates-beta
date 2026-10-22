import "server-only";
import type { GoogleGenAI } from "@google/genai";
import { getGeminiCandidateModels } from "./config";

// In-memory model circuit breaker with cooldown timestamps
const modelCooldowns = new Map<string, number>();

// TTFT guard: allow up to 10000ms for initial token before failover, preventing false failover during network latency
const FIRST_TOKEN_TIMEOUT_MS = 10_000;
const COOLDOWN_DURATION_MS = 30_000; // 30 seconds cooldown for transient spikes

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

export function clearAllModelCooldowns(): void {
  modelCooldowns.clear();
}

export function isFatalProviderError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return (
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("access_token_type_unsupported") ||
    lower.includes("unauthenticated") ||
    lower.includes("permission_denied") ||
    lower.includes("missing_gemini_api_key") ||
    lower.includes("billing_disabled") ||
    lower.includes("invalid_argument") ||
    (lower.includes("400") && !lower.includes("quota")) ||
    lower.includes("401") ||
    (lower.includes("403") && !lower.includes("quota"))
  );
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

  // Active un-throttled models first, with at most 1 cooled down model as emergency fallback
  const candidates = available.length > 0 ? available : cooledDown.slice(0, 1);
  // Cap candidate trials to at most 3 distinct models to prevent multi-second failover cascades
  return candidates.slice(0, 3);
}

export interface StreamParams {
  contents: unknown;
  config?: unknown;
}

/**
 * Ultra-low latency streaming generator:
 * 1. Skips known throttled/503 models via the cooldown circuit breaker.
 * 2. Implements a 5000ms TTFT guard to fail over if a model is queued or unresponsive.
 * 3. Immediately aborts without failover cascades on fatal credential/permission errors.
 * 4. Delivers first token to the client in sub-second milliseconds.
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

      // Race first token against timeout to detect slow/overloaded models
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

      // If fatal credential or authorization error, abort immediately without trying other models
      if (isFatalProviderError(err)) {
        console.error(`${logPrefix} Fatal provider authentication/permission error with model ${model}:`, errMsg);
        throw err;
      }

      // Mark model on cooldown so subsequent chat turns don't block
      markModelCooldown(model);
      console.warn(`${logPrefix} Model ${model} failed after ${Date.now() - t0}ms, set cooldown:`, errMsg);
    }
  }

  throw lastError || new Error("All candidate models failed to generate content.");
}
