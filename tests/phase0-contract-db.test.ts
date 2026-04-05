import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
const describeIfDb = DATABASE_URL ? describe : describe.skip;

describeIfDb("Phase 0 DB Contract Lock", () => {
  let client: ReturnType<typeof postgres>;

  beforeAll(() => {
    client = postgres(DATABASE_URL!, {
      prepare: false,
      max: 1,
      ssl: "require",
      connection: {
        application_name: "skillsync_phase0_contract_tests",
      },
    });
  });

  afterAll(async () => {
    await client.end({ timeout: 1 });
  });

  async function getColumns(tableName: string): Promise<string[]> {
    const rows = await client`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ORDER BY column_name
    `;
    return rows.map((row) => row.column_name as string);
  }

  async function getIndexes(tableName: string): Promise<string[]> {
    const rows = await client`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = ${tableName}
    `;
    return rows.map((row) => row.indexname as string);
  }

  it("amcat_sessions includes canonical lifecycle columns", async () => {
    const columns = await getColumns("amcat_sessions");

    expect(columns).toEqual(expect.arrayContaining([
      "college_id",
      "session_name",
      "uploaded_by",
      "status",
      "score_weights",
      "category_thresholds",
      "total_students",
      "alpha_count",
      "beta_count",
      "gamma_count",
      "published_by",
      "published_at",
    ]));
  });

  it("amcat_results includes canonical scoring columns", async () => {
    const columns = await getColumns("amcat_results");

    expect(columns).toEqual(expect.arrayContaining([
      "session_id",
      "college_id",
      "sap_id",
      "csv_total",
      "csv_category",
      "computed_total",
      "computed_category",
      "final_category",
      "rank_in_session",
      "admin_overridden",
      "override_note",
      "is_edited",
    ]));
  });

  it("resources includes status contract", async () => {
    const columns = await getColumns("resources");
    expect(columns).toContain("status");
  });

  it("critical contract indexes exist", async () => {
    const sessionIndexes = await getIndexes("amcat_sessions");
    const resultIndexes = await getIndexes("amcat_results");
    const resourceIndexes = await getIndexes("resources");

    expect(sessionIndexes).toContain("idx_amcat_sessions_college_session_name");
    expect(resultIndexes).toEqual(expect.arrayContaining([
      "idx_amcat_results_session_final_category",
      "idx_amcat_results_session_rank",
      "idx_amcat_results_college_sap",
    ]));
    expect(resourceIndexes).toEqual(expect.arrayContaining([
      "idx_resources_college_status",
      "idx_resources_author_status",
    ]));
  });
});
