/**
 * Builds lib/demo/fixture-embeddings.json once, so provisioning a guest
 * workspace makes no AI calls. Run: npx tsx scripts/demo/build-embeddings.ts
 * Uses GOOGLE_GENERATIVE_AI_API_KEY from .env.local / .env / ../.env (never printed).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { FIXTURE_CANDIDATES, FIXTURE_OPENINGS, SAMPLE_STUDENT, demoJdEmbeddingText, toParsedJd, toStudentProfile } from "../../lib/demo/fixtures";
import { composeStudentEmbeddingText } from "../../lib/embeddings/compose";

function loadKey(): string {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  for (const file of [".env.local", ".env", "../.env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    const line = readFileSync(path, "utf8").split(/\r?\n/).find((l) => l.startsWith("GOOGLE_GENERATIVE_AI_API_KEY="));
    if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not found");
}

async function embed(key: string, text: string): Promise<number[]> {
  const model = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ content: { parts: [{ text }] }, taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: 768 }),
  });
  if (!res.ok) throw new Error(`embed failed: HTTP ${res.status}`);
  const values: number[] = (await res.json()).embedding.values;
  if (values.length !== 768) throw new Error(`unexpected dimension ${values.length}`);
  const norm = Math.sqrt(values.reduce((s, v) => s + v * v, 0));
  return values.map((v) => Number((v / norm).toFixed(7)));
}

async function main() {
  const key = loadKey();
  const out: { model: string; dimensions: 768; builtAt: string; people: Record<string, number[]>; openings: Record<string, number[]> } =
    { model: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001", dimensions: 768, builtAt: new Date().toISOString(), people: {}, openings: {} };
  for (const person of [SAMPLE_STUDENT, ...FIXTURE_CANDIDATES]) {
    out.people[person.key] = await embed(key, composeStudentEmbeddingText(toStudentProfile(person)));
  }
  for (const opening of FIXTURE_OPENINGS) {
    out.openings[opening.key] = await embed(key, demoJdEmbeddingText(toParsedJd(opening)));
  }
  writeFileSync(resolve(process.cwd(), "lib/demo/fixture-embeddings.json"), JSON.stringify(out));
  console.log(`wrote ${Object.keys(out.people).length} people + ${Object.keys(out.openings).length} openings (${out.model}, 768-dim)`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
