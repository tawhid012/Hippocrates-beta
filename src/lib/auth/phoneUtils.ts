/**
 * Phone authentication utilities for Hippocrates AI Clinical Copilot.
 * Handles normalization, validation, and internal alias resolution
 * to support instant mobile authentication with or without SMS providers.
 */

export function normalizePhoneNumber(rawPhone: string): string {
  const trimmed = rawPhone.trim();
  const cleaned = trimmed.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  return `+${cleaned}`;
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

export function isPhoneInternalEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.endsWith("@hippocrates.internal") && email.startsWith("phone_");
}

export function extractPhoneFromInternalEmail(email?: string | null): string | null {
  if (!email || !isPhoneInternalEmail(email)) return null;
  const match = email.match(/^phone_(\d+)@hippocrates\.internal$/);
  return match ? `+${match[1]}` : null;
}
