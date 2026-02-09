/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Input Sanitization for AI Prompts
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Strips prompt-injection patterns from user-supplied text before it is
 * forwarded to any LLM.  This is a defence-in-depth layer — model-level
 * system prompts are the primary guard.
 *
 * Rules:
 *  - Remove common injection prefixes ("ignore previous instructions", etc.)
 *  - Strip markdown code fences that could embed hidden commands
 *  - Collapse excessive whitespace (>5 consecutive newlines)
 *  - Truncate to a configurable max length (default 50 000 chars)
 *  - Never throw — always return a (possibly shortened) string
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const DEFAULT_MAX_LENGTH = 50_000;

/**
 * Known prompt-injection phrases (case-insensitive).
 * Matched at the start of a line or after whitespace.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /disregard\s+(all\s+)?previous\s+(instructions|prompts)/gi,
  /you\s+are\s+now\s+/gi,
  /system\s*:\s*/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<<SYS>>/gi,
  /<\/SYS>>/gi,
  /\bRESET\b.*\bSYSTEM\b/gi,
  /\bACT\s+AS\b/gi,
  /\bDO\s+NOT\s+FOLLOW\b/gi,
  /\bFORGET\s+(ALL\s+)?(PREVIOUS|ABOVE)\b/gi,
];

/**
 * Sanitise user-supplied text before passing it to an AI model.
 *
 * @param text - Raw user input (resume text, JD text, etc.)
 * @param maxLength - Maximum allowed character length (default 50 000)
 * @returns Cleaned string safe to embed in an LLM prompt
 */
export function sanitizeInput(
  text: string,
  maxLength: number = DEFAULT_MAX_LENGTH,
): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Strip known injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // 2. Remove markdown code fences that could hide instructions
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");

  // 3. Collapse excessive newlines (>5 → 2)
  cleaned = cleaned.replace(/\n{6,}/g, "\n\n");

  // 4. Truncate to max length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned.trim();
}
