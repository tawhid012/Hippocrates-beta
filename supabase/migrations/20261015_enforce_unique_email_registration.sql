-- ==============================================================================
-- HIPPOCRATES AI CLINICAL PLATFORM
-- Migration: Enforce Strict Unique Email Registration in Public Profiles
-- Date: 2026-10-15
-- ==============================================================================

-- 1. Ensure case-insensitive unique index exists on profiles.email
-- Standard SQL allows multiple NULLs in UNIQUE indexes, but prevents duplicate non-null emails.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_email
  ON public.profiles (lower(trim(email)))
  WHERE email IS NOT NULL;

-- 2. Ensure case-insensitive unique index exists on profiles.phone
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_phone
  ON public.profiles (trim(phone))
  WHERE phone IS NOT NULL;

-- 3. Document the clinical compliance rule
COMMENT ON INDEX idx_profiles_unique_email IS
  'Guarantees strict 1-to-1 mapping between email address and Hippocrates user profile to prevent account collision.';
