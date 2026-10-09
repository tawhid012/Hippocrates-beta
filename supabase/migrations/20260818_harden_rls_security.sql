-- ==============================================================================
-- SUPABASE MIGRATION: HARDEN ROW LEVEL SECURITY & ELIMINATE ANONYMOUS LEAKS
-- ==============================================================================
-- Date: 2026-08-18
-- Description:
--   Removes insecure 'OR user_id IS NULL' checks from all RLS policies.
--   Enforces strict user isolation for authenticated users.
--   Backend service layer enforces cryptographic session token ownership
--   for web-based consultations.

-- 1. Ensure RLS is enabled on all tables containing sensitive data
ALTER TABLE IF EXISTS public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.report_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clinical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Drop insecure legacy policies that allowed global anonymous access
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can manage their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can manage their own attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can manage their own medical reports" ON public.medical_reports;
DROP POLICY IF EXISTS "Users can manage their own report analyses" ON public.report_analyses;
DROP POLICY IF EXISTS "Users can manage their own clinical documents" ON public.clinical_documents;

-- 3. Create hardened policies: Only authenticated users matching user_id may read/write
CREATE POLICY "Authenticated users can manage their own sessions"
  ON public.chat_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can manage their own chat messages"
  ON public.chat_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = chat_messages.session_id
      AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = chat_messages.session_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can manage their own attachments"
  ON public.attachments FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = attachments.session_id
      AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = attachments.session_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can manage their own medical reports"
  ON public.medical_reports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can manage their own report analyses"
  ON public.report_analyses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can manage their own clinical documents"
  ON public.clinical_documents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket RLS hardening
DROP POLICY IF EXISTS "Users can upload report files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read report files" ON storage.objects;

CREATE POLICY "Authenticated users can upload report files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'medical_reports' AND auth.uid() = owner);

CREATE POLICY "Authenticated users can read report files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'medical_reports' AND auth.uid() = owner);

-- Index metadata->>'owner_token' for microsecond lookups in server-boundary session scoping
CREATE INDEX IF NOT EXISTS idx_chat_sessions_owner_token
  ON public.chat_sessions ((metadata->>'owner_token'));
