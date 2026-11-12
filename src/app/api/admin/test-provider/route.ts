import { apiError, ok, parseJsonError } from "@/lib/api/response";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { getUserFacingOracleError, testOracleProvider } from "@/lib/ai/oracle";
import { getAISettings } from "@/lib/ai/settings";
import type { AIProviderId } from "@/lib/ai/provider";

function isProvider(value: unknown): value is AIProviderId {
  return value === "openai" || value === "gemini";
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return apiError("Unauthorized.", 401);

  let body: { provider?: unknown; apiKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return parseJsonError();
  }

  if (!isProvider(body.provider)) return apiError("Invalid provider.", 400);

  let keyToTest = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!keyToTest) {
    const settings = await getAISettings(true);
    keyToTest = body.provider === "gemini" ? settings.geminiApiKey || "" : settings.openaiApiKey || "";
  }

  if (!keyToTest) {
    return apiError(
      "No API key provided or found in database. Please enter an API key and click 'Save Key to Database'.",
      400
    );
  }

  try {
    await testOracleProvider(body.provider, keyToTest);
    return ok({ status: "connected" });
  } catch (error) {
    const rawError = getUserFacingOracleError(error);
    if (rawError === "INVALID_API_KEY" || rawError.includes("API key not valid") || rawError.includes("API_KEY_INVALID")) {
      return apiError(
        "Invalid API key: Google Gemini rejected this key. Please generate a fresh API key at https://aistudio.google.com and paste it in the field above.",
        400
      );
    }
    if (rawError === "QUOTA_EXCEEDED" || rawError.includes("quota") || rawError.includes("RESOURCE_EXHAUSTED")) {
      return apiError(
        "Quota exceeded: This Gemini API key has exceeded its daily free-tier rate limits. Please upgrade billing in Google AI Studio or provide a fresh key.",
        400
      );
    }
    if (rawError === "TIMEOUT") {
      return apiError(
        "Connection test timed out after 12 seconds. Google servers may be slow or experiencing high latency. Please retry.",
        408
      );
    }
    return apiError(rawError, 400);
  }
}

