// @vitest-environment node
import { describe, expect, it } from "vitest";
import { checkSupabaseKeys, supabasePublishableKey, supabaseSecretKey } from "@/lib/supabase-keys";

// Fabricated values only. They have the right shape but are not real keys.
const SECRET = "sb_secret_test_not_a_real_key_000000";
const PUBLISHABLE = "sb_publishable_test_not_a_real_key_000";
const b64 = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const legacyJwt = (role: string) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ iss: "supabase", role })}.fake-signature`;

describe("Supabase key configuration", () => {
  it("reads only the current key formats", () => {
    expect(supabaseSecretKey({ SUPABASE_SECRET_KEY: SECRET })).toBe(SECRET);
    expect(supabasePublishableKey({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE })).toBe(PUBLISHABLE);
    expect(supabaseSecretKey({ SUPABASE_SECRET_KEY: legacyJwt("service_role") })).toBeUndefined();
    expect(supabaseSecretKey({ SUPABASE_SERVICE_ROLE_KEY: SECRET })).toBeUndefined();
    expect(supabasePublishableKey({ NEXT_PUBLIC_SUPABASE_ANON_KEY: PUBLISHABLE })).toBeUndefined();
  });

  it("treats a secret or service-role key in a NEXT_PUBLIC_ variable as fatal", () => {
    for (const env of [
      { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: SECRET },
      { NEXT_PUBLIC_SUPABASE_ANON_KEY: legacyJwt("service_role") },
      { NEXT_PUBLIC_ANYTHING: SECRET },
    ]) {
      expect(checkSupabaseKeys(env).fatal).toHaveLength(1);
    }
    expect(checkSupabaseKeys({ NEXT_PUBLIC_SUPABASE_ANON_KEY: legacyJwt("anon") }).fatal).toEqual([]);
  });

  it("warns about wrong formats and leftover legacy variables", () => {
    const { fatal, warnings } = checkSupabaseKeys({
      SUPABASE_SECRET_KEY: legacyJwt("service_role"),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "eyJ-not-publishable",
      SUPABASE_SERVICE_ROLE_KEY: SECRET,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: PUBLISHABLE,
    });
    expect(fatal).toEqual([]);
    expect(warnings).toHaveLength(4);
  });

  it("never includes key values in its messages", () => {
    const report = checkSupabaseKeys({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: SECRET, SUPABASE_SECRET_KEY: "wrong-format-value", SUPABASE_SERVICE_ROLE_KEY: SECRET,
    });
    const text = [...report.fatal, ...report.warnings].join(" ");
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain("wrong-format-value");
  });

  it("accepts a clean configuration", () => {
    expect(checkSupabaseKeys({ SUPABASE_SECRET_KEY: SECRET, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE }))
      .toEqual({ fatal: [], warnings: [] });
  });
});
