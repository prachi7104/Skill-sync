// @vitest-environment node
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanLine, scanRepository, scanText } from "../../scripts/check-committed-credentials.mjs";

// Fabricated, credential-shaped values are assembled at runtime so that this
// file itself never contains one.
const fake = (prefix: string, length: number) => prefix + "Q7".repeat(Math.ceil(length / 2)).slice(0, length);
const SUPABASE = fake("sb_" + "secret_", 30);
const GROQ = fake("gsk" + "_", 40);
const GOOGLE = fake("AI" + "za", 35);
const DB_URL = `postgresql://postgres.abcdefgh:${fake("Pw", 19)}@pg-7.invalid-pool.net:6543/postgres`;

describe("committed-credential check", () => {
  it("finds no credential-like values in tracked files", () => {
    const findings = scanRepository(path.resolve(__dirname, "../.."));
    // Only file, line and rule are reported, so this output is safe to print.
    expect(findings).toEqual([]);
  });

  it("flags real-looking provider keys and connection strings", () => {
    expect(scanLine(`SUPABASE_SERVICE_ROLE_KEY=${SUPABASE}`)).toContain("supabase-secret-key");
    expect(scanLine(`GROQ_API_KEY=${GROQ}`)).toContain("groq-api-key");
    expect(scanLine(`key: "${GOOGLE}"`)).toContain("google-api-key");
    expect(scanLine(`DATABASE_URL=${DB_URL}`)).toEqual(["connection-string-password"]);
    expect(scanLine(`CRON_SECRET=${fake("c", 48)}`)).toEqual(["secret-assignment:CRON_SECRET"]);
    expect(scanLine(`NEXTAUTH_SECRET="${fake("n", 44)}"`)).toEqual(["secret-assignment:NEXTAUTH_SECRET"]);
  });

  it("allows placeholders, local development URLs and empty values", () => {
    for (const line of [
      "DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_DB_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:6543/postgres",
      'DATABASE_URL="postgres://user:pass@host:5432/db"',
      'process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://test:test@localhost:5432/test";',
      "NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET",
      'GROQ_API_KEY="your-key"',
      "SUPABASE_SERVICE_ROLE_KEY=...",
      "CRON_SECRET=",
      "NEXTAUTH_URL=http://localhost:3000",
      'Authorization: Bearer ${{ secrets.CRON_SECRET }}',
      `${SUPABASE} // credential-check: allow`,
    ]) {
      expect(scanLine(line), line).toEqual([]);
    }
  });

  it("reports locations and rule names but never the value", () => {
    const findings = scanText(["# config", `GROQ_API_KEY=${GROQ}`, `DATABASE_URL=${DB_URL}`].join("\n"));
    expect(findings).toEqual([
      { line: 2, rule: "groq-api-key" },
      { line: 2, rule: "secret-assignment:GROQ_API_KEY" },
      { line: 3, rule: "connection-string-password" },
    ]);
    const serialized = JSON.stringify(findings);
    for (const secret of [GROQ, DB_URL, SUPABASE]) expect(serialized).not.toContain(secret);
  });
});
