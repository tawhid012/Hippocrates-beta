/**
 * Phone authentication and formatting utilities for Hippocrates AI Clinical Copilot.
 * Handles normalization, validation, internal alias resolution, and clean user display.
 */

export function normalizePhoneNumber(rawPhone: string): string {
  const trimmed = rawPhone.trim();
  const digitsOnly = trimmed.replace(/[^\d]/g, "");

  // If already starts with +, preserve the country code
  if (trimmed.startsWith("+")) {
    return `+${digitsOnly}`;
  }

  // If a 10-digit number is entered without country code (standard Indian mobile format)
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    return `+91${digitsOnly}`;
  }

  // 11 digits starting with 0 (e.g. 09876543210)
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return `+91${digitsOnly.slice(1)}`;
  }

  return `+${digitsOnly}`;
}

export function isValidPhoneNumber(rawPhone: string): boolean {
  const digitsOnly = rawPhone.replace(/[^\d]/g, "");
  // Valid phone numbers contain between 7 and 15 digits according to E.164
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

export function phoneToInternalEmail(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `phone_${digits}@hippocrates.internal`;
}

/**
 * Returns all potential candidate internal emails for a given phone number.
 * Ensures accounts registered with or without country code (+91, +1, or 10-digit)
 * authenticate seamlessly regardless of how the user formats the number.
 */
export function getPhoneAliasCandidates(phone: string): string[] {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return [];

  const candidates = new Set<string>();

  // Primary candidate: exact digits
  candidates.add(`phone_${digits}@hippocrates.internal`);

  // If 10 digits (e.g. 8638691439)
  if (digits.length === 10) {
    candidates.add(`phone_91${digits}@hippocrates.internal`);
    candidates.add(`phone_1${digits}@hippocrates.internal`);
  }

  // If 12 digits starting with 91 (+91...)
  if (digits.length === 12 && digits.startsWith("91")) {
    candidates.add(`phone_${digits.slice(2)}@hippocrates.internal`);
  }

  // If 11 digits starting with 1 (+1...)
  if (digits.length === 11 && digits.startsWith("1")) {
    candidates.add(`phone_${digits.slice(1)}@hippocrates.internal`);
  }

  // If 11 digits starting with 0 (09876...)
  if (digits.length === 11 && digits.startsWith("0")) {
    const withoutZero = digits.slice(1);
    candidates.add(`phone_${withoutZero}@hippocrates.internal`);
    candidates.add(`phone_91${withoutZero}@hippocrates.internal`);
  }

  return Array.from(candidates);
}

/**
 * Sanitize error messages so users never see internal provider messages like
 * "Phone logins are disabled" or "Phone signups are disabled".
 */
export function sanitizeAuthError(
  error: Error | { message?: string } | string | null | undefined,
  mode: "signin" | "signup" = "signin"
): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  const raw = typeof error === "string" ? error : error.message || "";
  const lower = raw.toLowerCase();

  if (
    lower.includes("phone logins are disabled") ||
    lower.includes("phone signups are disabled") ||
    lower.includes("mobile login is disabled") ||
    lower.includes("phone_provider_disabled") ||
    lower.includes("sms") ||
    lower.includes("invalid login credentials")
  ) {
    if (mode === "signin") {
      return "Invalid mobile number or password. Please check your credentials or register an account.";
    }
    return "An account with this mobile number could not be registered. Please check the number or sign in.";
  }

  if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("duplicate")) {
    return "An account with this mobile number is already registered. Please sign in instead.";
  }

  return raw;
}

export function isPhoneInternalEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.endsWith("@hippocrates.internal") && (email.startsWith("phone_") || email.startsWith("phone__"));
}

export function extractPhoneFromInternalEmail(email?: string | null): string | null {
  if (!email || !isPhoneInternalEmail(email)) return null;
  const match = email.match(/^phone_+(\d+)@hippocrates\.internal$/);
  return match ? `+${match[1]}` : null;
}

/**
 * Format any raw phone string into a readable international format.
 * E.g., "+918638691439" -> "+91 86386 91439"
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.trim();
  const digits = cleaned.replace(/[^\d]/g, "");

  // Indian numbers: +91 XXXXX XXXXX (10-digit subscriber)
  if (digits.startsWith("91") && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  // US / Canada: +1 (XXX) XXX-XXXX (10-digit subscriber)
  if (digits.startsWith("1") && digits.length === 11) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  // Standard with country code
  if (cleaned.startsWith("+") && digits.length > 8) {
    return `+${digits.slice(0, digits.length - 8)} ${digits.slice(-8, -4)} ${digits.slice(-4)}`;
  }
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  return `+${digits}`;
}

/**
 * Cleanly format user identifier for UI (Profile Menu, Headers, Modals).
 * Never displays internal aliases like phone__918638691439@hippocrates.internal!
 */
export function formatUserIdentifier(
  user?: {
    email?: string | null;
    phone?: string | null;
    user_metadata?: Record<string, unknown> | null;
  } | null
): string {
  if (!user) return "";

  // 1. Check user_metadata.phone or phone_number
  const metaPhone =
    (user.user_metadata?.phone as string | undefined) ||
    (user.user_metadata?.phone_number as string | undefined);
  if (metaPhone && typeof metaPhone === "string" && metaPhone.trim()) {
    return formatPhoneNumber(metaPhone);
  }

  // 2. Check native user.phone property
  if (user.phone && user.phone.trim()) {
    return formatPhoneNumber(user.phone);
  }

  // 3. Check if email is an internal phone alias (e.g. phone_918638691439@hippocrates.internal)
  if (user.email && isPhoneInternalEmail(user.email)) {
    const extracted = extractPhoneFromInternalEmail(user.email);
    if (extracted) {
      return formatPhoneNumber(extracted);
    }
  }

  // 4. Return clean standard email
  return user.email || "";
}
