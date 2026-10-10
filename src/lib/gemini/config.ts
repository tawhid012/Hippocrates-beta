import "server-only";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

export const SUPPORTED_GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-pro",
] as const;

/**
 * Returns candidate models in priority order for controlled fallback.
 */
export function getGeminiCandidateModels(): string[] {
  const preferred = getGeminiModelName();
  return Array.from(
    new Set([
      preferred,
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-3.7-flash",
      "gemini-3.8-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
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
