-- ==============================================================================
-- SUPABASE MIGRATION: HARDEN APP_SETTINGS SINGLETON & RLS RESILIENCE
-- ==============================================================================
-- Date: 2026-11-12
-- Description:
--   Ensures app_settings singleton row exists and has appropriate RLS access.
--   Enables service_role bypass and ensures singleton constraint is maintained.

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_provider text NOT NULL DEFAULT 'gemini',
  openai_api_key text,
  gemini_api_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_active_provider_check CHECK (active_provider IN ('openai', 'gemini'))
);

-- 2. Ensure singleton unique index
CREATE UNIQUE INDEX IF NOT EXISTS app_settings_singleton_idx
  ON public.app_settings ((true));

-- 3. Ensure at least one default row exists
INSERT INTO public.app_settings (active_provider, openai_api_key, gemini_api_key)
SELECT 'gemini', null, null
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);

-- 4. Ensure service role has full access
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on app_settings" ON public.app_settings;
CREATE POLICY "Service role full access on app_settings"
  ON public.app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
