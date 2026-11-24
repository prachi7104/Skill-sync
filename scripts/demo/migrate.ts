/**
 * Prepares the dedicated guest-mode (demo) database.
 *
 * Usage:
 *   npx tsx scripts/demo/migrate.ts --confirm-ref=<demo project ref> [--fresh]
 *
 * --fresh  first creates the full SkillSync schema from lib/db/schema.ts plus
 *          the vector extension. Use it once on a new, empty demo project.
 *
 * Then it applies scripts/sql-editor/guest-mode.sql and schedules the guarded
 * guest-mode-cleanup pg_cron job.
 *
 * Refuses to run unless:
 *   - --confirm-ref matches the project the connection actually targets;
 *   - that ref equals GUEST_DATABASE_PROJECT_REF;
 *   - that ref is not the institutional production project.
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { loadDatabaseUrl, readEnvFile } from "./db-env";
import { CLEANUP_JOB, CLEANUP_SQL } from "./cleanup-sql";
import { assertDemoTarget } from "./target-guard";

const GUEST_EXCLUSION = "AND NOT EXISTS (SELECT 1 FROM public.demo_workspaces w WHERE w.college_id = s.college_id)";

async function baseSchemaStatements(): Promise<string[]> {
  const schema = await import("../../lib/db/schema");
  const { generateDrizzleJson, generateMigration } = await import("drizzle-kit/api");
  const statements = await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema as unknown as Record<string, unknown>));
  // drizzle-kit renders the custom-typed vector indexes as btree, which cannot
  // hold 768-d vectors; create them as HNSW explicitly instead.
  return [
    ...statements.filter((s) => !/create index[^;]*_hnsw/i.test(s)),
    `CREATE INDEX IF NOT EXISTS idx_students_embedding_hnsw ON public.students USING hnsw (embedding vector_cosine_ops)`,
    `CREATE INDEX IF NOT EXISTS idx_drives_jd_embedding_hnsw ON public.drives USING hnsw (jd_embedding vector_cosine_ops)`,
  ];
}

async function main() {
  const { url, ref } = loadDatabaseUrl();
  const confirm = process.argv.find((a) => a.startsWith("--confirm-ref="))?.split("=")[1];
  const fresh = process.argv.includes("--fresh");
  assertDemoTarget(ref, process.env.GUEST_DATABASE_PROJECT_REF ?? readEnvFile("GUEST_DATABASE_PROJECT_REF"), confirm);

  const sql = postgres(url, { max: 1, prepare: false, ssl: "require" });
  try {
    if (fresh) {
      const [{ n }] = await sql`select count(*)::int n from information_schema.tables where table_schema = 'public'`;
      if (n > 0) throw new Error(`--fresh needs an empty public schema; found ${n} tables`);
      const statements = await baseSchemaStatements();
      await sql.begin(async (tx) => {
        await tx.unsafe("CREATE EXTENSION IF NOT EXISTS vector");
        for (const statement of statements) await tx.unsafe(statement);
      });
      console.log(`base schema: ${statements.length} statements applied`);
    }

    const ddl = fs.readFileSync(path.resolve(__dirname, "../sql-editor/guest-mode.sql"), "utf8");
    await sql.begin(async (tx) => { await tx.unsafe(ddl); });
    console.log("guest-mode tables: applied");

    // Keep the nightly embedding re-queue (if this project has one) away from guest workspaces.
    const [job] = await sql`select jobid, command from cron.job where jobname = 'requeue-stale-embeddings'`;
    if (job && !String(job.command).includes("demo_workspaces")) {
      const marker = "WHERE s.profile_completeness >= 50";
      if (!String(job.command).includes(marker)) throw new Error("requeue-stale-embeddings changed shape; patch manually");
      const patched = String(job.command).replace(marker, `${marker}\n      ${GUEST_EXCLUSION}`);
      await sql`select cron.alter_job(${job.jobid}::bigint, command := ${patched})`;
      console.log("requeue-stale-embeddings: guest workspaces excluded");
    } else console.log("requeue-stale-embeddings: already excludes guests or absent");

    // Bounded retention: delete expired guest workspaces every 30 minutes (guarded by .demo.invalid).
    await sql`select cron.schedule(${CLEANUP_JOB}, '*/30 * * * *', ${CLEANUP_SQL})`;
    console.log(`${CLEANUP_JOB}: scheduled every 30 minutes`);

    const check = await sql`select to_regclass('public.colleges') c, to_regclass('public.demo_workspaces') w, to_regclass('public.demo_resume_files') f, to_regclass('public.demo_resume_jobs') j`;
    console.log("verify:", check[0]);
  } finally { await sql.end(); }
}
main().catch((e) => { console.error(e.message); process.exit(1); });
