/**
 * In-process PostgreSQL (PGlite + pgvector) built from the canonical Drizzle
 * schema. Nothing leaves the test process: no network, no shared database.
 */
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/lib/db/schema";

export async function createTestDatabase() {
  const client = new PGlite({ extensions: { vector } });
  await client.exec("create extension if not exists vector;");
  const { generateDrizzleJson, generateMigration } = await import("drizzle-kit/api");
  const empty = generateDrizzleJson({});
  const target = generateDrizzleJson(schema as unknown as Record<string, unknown>);
  const statements = await generateMigration(empty, target);
  // Vector ANN indexes are a performance detail; drizzle-kit renders the
  // custom-typed HNSW index as a btree, which cannot hold 768-d vectors.
  for (const statement of statements) {
    if (/create index[^;]*_hnsw/i.test(statement)) continue;
    await client.exec(statement);
  }
  const db = drizzle(client, { schema });
  return { db, client, close: () => client.close() };
}
