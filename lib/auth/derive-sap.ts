/**
 * Derives a 9-digit SAP ID from a UPES student email address.
 *
 * Pattern: "name.DIGITS@stu.upes.ac.in" → prefix + padded(DIGITS, 6)
 *   - ≥ 6 digits → "500" prefix
 *   - < 6 digits → "590" prefix (with zero-padding to 6)
 *
 * Returns null for non-UPES or non-matching emails.
 */
export function deriveSapFromEmailPublic(email: string): string | null {
    if (!email.toLowerCase().includes("stu.upes.ac.in")) return null;
    const username = email.split("@")[0].toLowerCase();
    const match = username.match(/\.(\d+)$/);
    if (!match) return null;
    const digits = match[1];
    const padded = digits.padStart(6, "0");
    const prefix = digits.length >= 6 ? "500" : "590";
    return prefix + padded;
}
