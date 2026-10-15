-- ==============================================================================
-- HIPPOCRATES AI CLINICAL COPILOT — CONSOLIDATED PENDING DATABASE MIGRATION
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USER PROFILES TABLE (Strict Patient vs Doctor Registration)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
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

-- ------------------------------------------------------------------------------
-- 2. UNIQUE EMAIL & PHONE INDEXES (PREVENTS DUPLICATE ACCOUNTS WITH SAME MAIL)
-- ------------------------------------------------------------------------------

-- Guarantee strict 1-to-1 mapping for case-insensitive emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_email
  ON public.profiles (lower(trim(email)))
  WHERE email IS NOT NULL;

-- Guarantee strict 1-to-1 mapping for phone numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_phone
  ON public.profiles (trim(phone))
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles(role);

CREATE INDEX IF NOT EXISTS idx_profiles_doctor_reg
  ON public.profiles(doctor_registration_number)
  WHERE doctor_registration_number IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 3. AUTOMATIC PROFILE CREATION TRIGGER (AUTH.USERS -> PUBLIC.PROFILES)
-- Runs automatically on every Email, Phone, and Google OAuth signup
-- ------------------------------------------------------------------------------

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for metadata updates (e.g. physician provides registration number later)
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
-- 4. BACKFILL EXISTING USERS INTO PUBLIC.PROFILES
-- Populates any accounts created before this trigger was run
-- ------------------------------------------------------------------------------

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
SELECT
  u.id,
  u.email,
  u.phone,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'User'),
  CASE WHEN u.raw_user_meta_data->>'role' = 'doctor' THEN 'doctor' ELSE 'patient' END,
  NULLIF(trim(u.raw_user_meta_data->>'doctor_registration_number'), ''),
  u.raw_user_meta_data->>'avatar_url',
  u.created_at,
  COALESCE(u.updated_at, u.created_at)
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = COALESCE(EXCLUDED.email, profiles.email),
  phone = COALESCE(EXCLUDED.phone, profiles.phone),
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  role = CASE WHEN profiles.role = 'doctor' THEN 'doctor' ELSE EXCLUDED.role END,
  doctor_registration_number = COALESCE(EXCLUDED.doctor_registration_number, profiles.doctor_registration_number),
  updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) FOR PROFILES
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

-- Allow new user profile insert during signup sync
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 6. PER-USER CLINICAL CHAT ISOLATION & FOREIGN KEYS
-- ------------------------------------------------------------------------------

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

-- Compound indexes for instantaneous user lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_workspace ON public.chat_sessions(user_id, workspace_type, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- ------------------------------------------------------------------------------
-- 7. DOCTOR DIRECTORY AUDIT VIEW
-- ------------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.doctor_directory AS
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.doctor_registration_number,
    p.created_at,
    (p.doctor_registration_number IS NOT NULL AND length(trim(p.doctor_registration_number)) >= 3) AS is_verified
  FROM public.profiles p
  WHERE p.role = 'doctor';
