-- ==============================================================================
-- HIPPOCRATES AI CLINICAL COPILOT — SUPABASE DATABASE MIGRATION
-- USER REGISTRATION (PATIENT & DOCTOR), PROFILES, & STRICT CHAT ISOLATION
-- ==============================================================================
-- Date: 2026-10-12
-- Features:
--   1. User Profiles schema with Doctor Registration Number enforcement
--   2. Automatic Supabase Auth trigger (syncs Google OAuth & Email sign-ups)
--   3. Row Level Security (RLS) on user profiles
--   4. Strict Per-User Chat Separation & Isolation (RLS on sessions & messages)
--   5. High-performance compound indexes for low-latency queries
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USER PROFILES TABLE (PATIENT & DOCTOR REGISTRATION WITH EMAIL & MOBILE PHONE)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('doctor', 'patient')),
  doctor_registration_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Ensure either email or mobile phone is provided
  CONSTRAINT check_email_or_phone CHECK (
    email IS NOT NULL OR phone IS NOT NULL
  ),

  -- Ensure doctors provide a valid registration number
  CONSTRAINT check_doctor_registration_number CHECK (
    role != 'doctor' OR (doctor_registration_number IS NOT NULL AND length(trim(doctor_registration_number)) >= 3)
  )
);

-- Index for searching and filtering profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_doctor_reg ON public.profiles(doctor_registration_number) WHERE doctor_registration_number IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 2. AUTOMATIC PROFILE CREATION TRIGGER (AUTH.USERS -> PUBLIC.PROFILES)
-- ------------------------------------------------------------------------------

-- Function to handle new user registration (Email, Mobile Phone, & Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  raw_role TEXT;
  raw_reg_no TEXT;
  raw_name TEXT;
  raw_avatar TEXT;
  raw_phone TEXT;
BEGIN
  -- Extract metadata provided during Sign-Up (Email/Phone or Google OAuth)
  raw_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  raw_reg_no := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'doctor_registration_number', '')), '');
  raw_phone := NULLIF(trim(COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '')), '');
  raw_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    CASE
      WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
      WHEN raw_phone IS NOT NULL THEN raw_phone
      ELSE 'User'
    END
  );
  raw_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL);

  INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    role,
    doctor_registration_number,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    raw_phone,
    raw_name,
    CASE WHEN raw_role = 'doctor' THEN 'doctor' ELSE 'patient' END,
    raw_reg_no,
    raw_avatar,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = CASE WHEN profiles.role = 'doctor' THEN 'doctor' ELSE EXCLUDED.role END,
    doctor_registration_number = COALESCE(EXCLUDED.doctor_registration_number, profiles.doctor_registration_number),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to synchronize user profile when user metadata is updated (e.g. Doctor enters Reg No or Phone)
CREATE OR REPLACE FUNCTION public.handle_user_metadata_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_role TEXT;
  new_reg_no TEXT;
  new_name TEXT;
  new_avatar TEXT;
  new_phone TEXT;
BEGIN
  new_role := NEW.raw_user_meta_data->>'role';
  new_reg_no := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'doctor_registration_number', '')), '');
  new_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name');
  new_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture');
  new_phone := NULLIF(trim(COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '')), '');

  UPDATE public.profiles
  SET
    email = COALESCE(NEW.email, profiles.email),
    phone = COALESCE(new_phone, profiles.phone),
    full_name = COALESCE(new_name, profiles.full_name),
    role = CASE WHEN new_role = 'doctor' THEN 'doctor' ELSE profiles.role END,
    doctor_registration_number = COALESCE(new_reg_no, profiles.doctor_registration_number),
    avatar_url = COALESCE(new_avatar, profiles.avatar_url),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_metadata_update();

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) FOR PROFILES
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 4. CHAT SESSIONS & MESSAGES PER-USER ISOLATION
-- ------------------------------------------------------------------------------

-- Ensure user_id column exists with proper foreign key
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.attachments
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.medical_reports
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.report_analyses
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.clinical_documents
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Compound indexes for zero-latency filtered lookups per user
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_workspace ON public.chat_sessions(user_id, workspace_type, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- Enable RLS across all chat tables
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5. HARDENED CHAT RLS POLICIES (SEPARATE CHATS FOR DIFFERENT USERS)
-- ------------------------------------------------------------------------------

-- CHAT SESSIONS: Strict isolation — User A can NEVER see or modify User B's sessions
DROP POLICY IF EXISTS "Authenticated users manage own sessions" ON public.chat_sessions;
CREATE POLICY "Authenticated users manage own sessions"
  ON public.chat_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CHAT MESSAGES: Strict isolation — messages only visible/writable by session owner
DROP POLICY IF EXISTS "Authenticated users manage own messages" ON public.chat_messages;
CREATE POLICY "Authenticated users manage own messages"
  ON public.chat_messages FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = chat_messages.session_id
      AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = chat_messages.session_id
      AND s.user_id = auth.uid()
    )
  );

-- ATTACHMENTS: Strict isolation
DROP POLICY IF EXISTS "Authenticated users manage own attachments" ON public.attachments;
CREATE POLICY "Authenticated users manage own attachments"
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

-- MEDICAL REPORTS: Strict isolation
DROP POLICY IF EXISTS "Authenticated users manage own reports" ON public.medical_reports;
CREATE POLICY "Authenticated users manage own reports"
  ON public.medical_reports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- REPORT ANALYSES: Strict isolation
DROP POLICY IF EXISTS "Authenticated users manage own analyses" ON public.report_analyses;
CREATE POLICY "Authenticated users manage own analyses"
  ON public.report_analyses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CLINICAL DOCUMENTS: Strict isolation
DROP POLICY IF EXISTS "Authenticated users manage own clinical documents" ON public.clinical_documents;
CREATE POLICY "Authenticated users manage own clinical documents"
  ON public.clinical_documents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. AUDIT HELPER VIEW (FOR ADMINS / VERIFICATION)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.doctor_directory AS
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.doctor_registration_number,
    p.created_at,
    (p.doctor_registration_number IS NOT NULL AND length(trim(p.doctor_registration_number)) >= 3) AS is_verified
  FROM public.profiles p
  WHERE p.role = 'doctor';
