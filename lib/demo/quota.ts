import { db } from "@/lib/db";
import { aiRateLimits } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

const quotas = {
  // [per workspace per day, global per day]
  enroll: [0, 200],
  resume: [5, 150],
  ats: [8, 200],
  chat: [15, 300],
  recommend: [6, 200],
  explain: [20, 300],
  jd_edit: [15, 200],
} as const;

export class DemoQuotaExceeded extends Error {}

export async function consumeDemoQuota(action: keyof typeof quotas, collegeId?: string) {
  const [perGuest, global] = quotas[action];
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  await db.transaction(async (tx) => {
    const limits: Array<[string, number]> = [[`demo:${action}:global`, global]];
    if (collegeId) limits.push([`demo:${action}:${collegeId}`, perGuest]);
    for (const [modelKey, limit] of limits) {
      const rows = await tx.insert(aiRateLimits).values({ modelKey, windowStart: day })
        .onConflictDoUpdate({
          target: [aiRateLimits.modelKey, aiRateLimits.windowStart],
          set: { requestCount: sql`${aiRateLimits.requestCount} + 1` },
          setWhere: sql`${aiRateLimits.requestCount} < ${limit}`,
        }).returning({ id: aiRateLimits.id });
      if (rows.length === 0) throw new DemoQuotaExceeded("Daily demo limit reached. Try again tomorrow.");
    }
  });
}
