import "server-only";

export const DEFAULT_GEMINI_MODEL = "gemini-flash-lite-latest";

export const SUPPORTED_GEMINI_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
] as const;

/**
 * Returns candidate models in priority order for controlled fallback.
 * Prioritizes high-throughput, low-latency models for sub-second TTFT.
 */
export function getGeminiCandidateModels(): string[] {
  const preferred = getGeminiModelName();
  return Array.from(
    new Set([
      preferred,
      "gemini-flash-lite-latest",
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
    ])
  );
}

/**
 * Returns the sanitized Gemini model identifier.
 * Ensures invalid tokens or dangerous strings are filtered,
 * allowing standard Gemini models with a safe, verified default.
 */
export function getGeminiModelName(): string {
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (
    envModel &&
    !envModel.startsWith("AQ.") &&
    !envModel.includes("/") &&
    !envModel.includes("..") &&
    envModel.length <= 64
  ) {
    return envModel;
  }
  return DEFAULT_GEMINI_MODEL;
}

export const AI_TIMEOUT_MS = 45_000;
