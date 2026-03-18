import crypto from "crypto";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";

/**
 * Generates a cryptographically random password.
 * 16 chars, mix of upper/lower/digits/symbols, excludes ambiguous chars.
 */
export function generateStrongPassword(): string {
  const bytes = crypto.randomBytes(16);
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join("");
}

/**
 * Validates password strength used by staff password flows.
 */
export function validatePasswordStrength(
  password: string,
): { valid: boolean; reason?: string } {
  if (password.length < 8) {
    return { valid: false, reason: "Minimum 8 characters required" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "Must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "Must contain at least one number" };
  }
  return { valid: true };
}
