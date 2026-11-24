// @vitest-environment node
/**
 * The pg_cron cleanup deletes colleges, which cascades through every
 * college-owned table. A non-guest college must survive even if it ends up in
 * demo_workspaces by mistake.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLEANUP_SQL } from "@/scripts/demo/cleanup-sql";
import { createTestDatabase } from "./helpers/pglite-db";

let database: Awaited<ReturnType<typeof createTestDatabase>>;

const GUEST = "00000000-0000-0000-0000-0000000000a1";
const REAL = "00000000-0000-0000-0000-0000000000b1";
const LIVE_GUEST = "00000000-0000-0000-0000-0000000000c1";

beforeAll(async () => {
  database = await createTestDatabase();
  const { client } = database;
  await client.exec(`
    insert into colleges (id, name, short_code, student_domain) values
      ('${GUEST}', 'Guest workspace', 'G1', 'g1.demo.invalid'),
      ('${REAL}', 'Real college', 'REAL', 'real.ac.in'),
      ('${LIVE_GUEST}', 'Live guest workspace', 'G2', 'g2.demo.invalid');
    insert into users (id, college_id, email, name, role) values
      ('00000000-0000-0000-0000-0000000000b2', '${REAL}', 'student@real.ac.in', 'Real Student', 'student');
    insert into demo_workspaces (college_id, student_user_id, recruiter_user_id, expires_at) values
      ('${GUEST}', gen_random_uuid(), gen_random_uuid(), now() - interval '1 hour'),
      ('${REAL}', gen_random_uuid(), gen_random_uuid(), now() - interval '1 hour'),
      ('${LIVE_GUEST}', gen_random_uuid(), gen_random_uuid(), now() + interval '1 hour');
  `);
}, 60_000);

afterAll(async () => database?.close());

describe("guest-mode-cleanup cron SQL", () => {
  it("deletes only expired guest colleges and never a real college", async () => {
    await database.client.exec(CLEANUP_SQL);
    const left = await database.client.query<{ id: string }>("select id from colleges order by id");
    expect(left.rows.map((row) => row.id)).toEqual([REAL, LIVE_GUEST]);
    const users = await database.client.query<{ n: number }>(`select count(*)::int n from users where college_id = '${REAL}'`);
    expect(users.rows[0].n).toBe(1);
  });
});
