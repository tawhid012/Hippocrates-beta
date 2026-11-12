import "server-only";

import { DEFAULT_ACTIVE_PROVIDER } from "@/config/ai";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { AIProviderId, ProviderRuntimeSettings } from "./provider";

type AppSettingsRow = {
  id?: string;
  active_provider: string | null;
  openai_api_key: string | null;
  gemini_api_key: string | null;
};

export interface AdminPublicSettings {
  activeProvider: AIProviderId;
  geminiConfigured: boolean;
  openaiConfigured: boolean;
  geminiMaskedKey?: string;
  openaiMaskedKey?: string;
}

export interface UpdateAdminSettingsInput {
  activeProvider?: AIProviderId;
  geminiApiKey?: string;
  openaiApiKey?: string;
}

interface StoredSettings {
  activeProvider: AIProviderId;
  openaiApiKey: string | null;
  geminiApiKey: string | null;
}

// In-memory runtime cache for high-throughput AI requests & instant persistence fallback
let inMemoryAdminSettings: StoredSettings | null = null;
let lastSettingsFetchTime = 0;
const SETTINGS_CACHE_TTL_MS = 60_000; // Cache database query for 60 seconds


function maskApiKey(key: string | null | undefined): string | undefined {
  if (!key || !key.trim()) return undefined;
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 6)}••••••••${trimmed.slice(-4)}`;
}

function determineDefaultProvider(geminiKey: string | null, openaiKey: string | null): AIProviderId {
  if (DEFAULT_ACTIVE_PROVIDER === "gemini" || (geminiKey && !openaiKey)) {
    return "gemini";
  }
  return "gemini"; // Default to Gemini as primary clinical engine
}

function normalizeProvider(
  provider: string | null | undefined,
  geminiKey: string | null,
  openaiKey: string | null
): AIProviderId {
  if (provider === "gemini") return "gemini";
  if (provider === "openai") return "openai";
  return determineDefaultProvider(geminiKey, openaiKey);
}

/**
 * Retrieves the currently active AI provider and API keys with high-performance in-memory caching.
 */
export async function getAISettings(forceRefresh = false): Promise<ProviderRuntimeSettings> {
  const now = Date.now();
  if (!forceRefresh && inMemoryAdminSettings && now - lastSettingsFetchTime < SETTINGS_CACHE_TTL_MS) {
    return inMemoryAdminSettings;
  }

  const geminiEnv = process.env.GEMINI_API_KEY?.trim() || null;
  const openaiEnv = process.env.OPENAI_API_KEY?.trim() || null;

  let dbGeminiKey: string | null = null;
  let dbOpenaiKey: string | null = null;
  let dbProvider: string | null = null;

  let dbFetchSuccess = false;

  try {
    const supabase = createSupabaseServiceClient();
    if (supabase) {
      // 8000ms timeout allows Supabase cold starts / sleep wakeups to complete safely without dropping keys
      const queryPromise = supabase
        .from("app_settings")
        .select("active_provider, openai_api_key, gemini_api_key")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<AppSettingsRow>();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
      const res = await Promise.race([queryPromise, timeoutPromise]);

      if (res && "data" in res && !res.error && res.data) {
        dbGeminiKey = res.data.gemini_api_key?.trim() || null;
        dbOpenaiKey = res.data.openai_api_key?.trim() || null;
        dbProvider = res.data.active_provider;
        dbFetchSuccess = true;
      } else if (res && "error" in res && res.error) {
        console.warn("[getAISettings] Supabase query returned error:", res.error.message);
      }
    }
  } catch (err) {
    console.warn("Could not read app_settings from database:", err);
  }

  // Database takes top priority, then existing in-memory cache (to prevent cold-start loss), then valid environment variable
  const validEnvGemini = geminiEnv ? geminiEnv : null;
  const finalGeminiKey =
    dbGeminiKey ||
    inMemoryAdminSettings?.geminiApiKey ||
    validEnvGemini ||
    null;

  const finalOpenaiKey =
    dbOpenaiKey ||
    inMemoryAdminSettings?.openaiApiKey ||
    openaiEnv ||
    null;

  const rawProvider = dbProvider || inMemoryAdminSettings?.activeProvider;
  const activeProvider = normalizeProvider(rawProvider, finalGeminiKey, finalOpenaiKey);

  // Sync memory cache
  inMemoryAdminSettings = {
    activeProvider,
    geminiApiKey: finalGeminiKey,
    openaiApiKey: finalOpenaiKey,
  };
  // If DB query failed (e.g. cold start), retry sooner (5s) instead of caching nulls for 60s
  lastSettingsFetchTime = dbFetchSuccess ? now : now - SETTINGS_CACHE_TTL_MS + 5000;

  return inMemoryAdminSettings;
}

/**
 * Returns sanitized settings for the Admin Panel without exposing the raw API keys.
 */
export async function getAdminSettings(): Promise<AdminPublicSettings> {
  const settings = await getAISettings();
  return {
    activeProvider: settings.activeProvider,
    geminiConfigured: Boolean(settings.geminiApiKey && settings.geminiApiKey.length > 5),
    openaiConfigured: Boolean(settings.openaiApiKey && settings.openaiApiKey.length > 5),
    geminiMaskedKey: maskApiKey(settings.geminiApiKey),
    openaiMaskedKey: maskApiKey(settings.openaiApiKey),
  };
}

/**
 * Updates AI settings and persists the new API key to the database.
 * Changes take effect immediately for all subsequent Oracle and Aegis requests.
 */
export async function updateAdminSettings(input: UpdateAdminSettingsInput): Promise<AdminPublicSettings> {
  const current = await getAISettings();

  const newGeminiKey =
    input.geminiApiKey !== undefined
      ? input.geminiApiKey.trim() || null
      : current.geminiApiKey;

  const newOpenaiKey =
    input.openaiApiKey !== undefined
      ? input.openaiApiKey.trim() || null
      : current.openaiApiKey;

  const newActiveProvider = input.activeProvider || current.activeProvider;

  // Persist to Supabase database with error propagation
  const supabase = createSupabaseServiceClient();
  if (supabase) {
    const payload = {
      active_provider: newActiveProvider,
      gemini_api_key: newGeminiKey,
      openai_api_key: newOpenaiKey,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: findError } = await supabase
      .from("app_settings")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<Pick<AppSettingsRow, "id">>();

    if (findError) {
      console.warn("[updateAdminSettings] Could not query existing row:", findError.message);
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("app_settings")
        .update(payload)
        .eq("id", existing.id);
      if (updateError) {
        throw new Error(`Failed to update database settings: ${updateError.message}`);
      }
    } else {
      const { error: insertError } = await supabase
        .from("app_settings")
        .insert(payload);
      if (insertError) {
        throw new Error(`Failed to insert database settings: ${insertError.message}`);
      }
    }
  }

  // Update in-memory cache immediately upon successful persist
  inMemoryAdminSettings = {
    activeProvider: newActiveProvider,
    geminiApiKey: newGeminiKey,
    openaiApiKey: newOpenaiKey,
  };
  lastSettingsFetchTime = Date.now();

  return getAdminSettings();
}

