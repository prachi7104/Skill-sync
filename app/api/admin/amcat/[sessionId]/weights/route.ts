import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  AmcatCategoryThresholds,
  AmcatRowRaw,
  AmcatScoreWeights,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS,
  computeAmcatCategory,
  computeAmcatTotal,
  validateThresholds,
  validateWeights,
} from "@/lib/amcat/parser";
import { hasAmcatManagementPermission } from "@/lib/amcat/permissions";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const allowed = await hasAmcatManagementPermission(session);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!session?.user?.collegeId) {
      return NextResponse.json({ error: "Missing college context" }, { status: 401 });
    }

    const body = await req.json();
    const { weights, thresholds } = body as {
      weights?: AmcatScoreWeights;
      thresholds?: AmcatCategoryThresholds;
    };

    if (weights) {
      const validation = validateWeights(weights);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.reason }, { status: 400 });
      }
    }

    if (thresholds) {
      const thresholdValidation = validateThresholds(thresholds);
      if (!thresholdValidation.valid) {
        return NextResponse.json({ error: thresholdValidation.reason }, { status: 400 });
      }
    }

    const [sessionRow] = await db.execute(sql`
      SELECT id
      FROM amcat_sessions
      WHERE id = ${params.sessionId}
        AND college_id = ${session.user.collegeId}
      LIMIT 1
    `) as unknown as Array<{ id: string }>;

    if (!sessionRow) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const results = await db.execute(sql`
    SELECT
      id,
      cs_score,
      cp_score,
      automata_score,
      automata_fix_score,
      quant_score,
      admin_overridden,
      final_category
    FROM amcat_results
    WHERE session_id = ${params.sessionId}
      AND college_id = ${session.user.collegeId}
  `) as unknown as Array<Record<string, unknown>>;

    if (results.length === 0) {
      return NextResponse.json({ error: "No AMCAT results available for this session" }, { status: 409 });
    }

    const newWeights = weights ?? DEFAULT_WEIGHTS;
    const newThresholds = thresholds ?? DEFAULT_THRESHOLDS;

    const recomputed = results.map((row) => ({
      id: row.id as string,
      admin_overridden: Boolean(row.admin_overridden),
      final_category: row.final_category as "alpha" | "beta" | "gamma" | null,
      computed_total: computeAmcatTotal(row as unknown as AmcatRowRaw, newWeights),
    }));

    recomputed.sort((a, b) => b.computed_total - a.computed_total);
    const rankedRows = recomputed.map((row, index) => ({ ...row, rank: index + 1 }));

    const updates = rankedRows.map((row) => {
      const computedCategory = computeAmcatCategory(row.computed_total, newThresholds);
      const finalCategory = row.admin_overridden && row.final_category
        ? row.final_category
        : computedCategory;

      return sql`
      UPDATE amcat_results
      SET
        computed_total = ${row.computed_total},
        computed_category = ${computedCategory}::batch_category,
        final_category = ${finalCategory}::batch_category,
        rank_in_session = ${row.rank},
        updated_at = NOW()
      WHERE id = ${row.id}
    `;
    });

    for (const statement of updates) {
      await db.execute(statement);
    }

    const distribution = {
      alpha: rankedRows.filter((row) => {
        const computedCategory = computeAmcatCategory(row.computed_total, newThresholds);
        const finalCategory = row.admin_overridden && row.final_category
          ? row.final_category
          : computedCategory;
        return finalCategory === "alpha";
      }).length,
      beta: rankedRows.filter((row) => {
        const computedCategory = computeAmcatCategory(row.computed_total, newThresholds);
        const finalCategory = row.admin_overridden && row.final_category
          ? row.final_category
          : computedCategory;
        return finalCategory === "beta";
      }).length,
      gamma: rankedRows.filter((row) => {
        const computedCategory = computeAmcatCategory(row.computed_total, newThresholds);
        const finalCategory = row.admin_overridden && row.final_category
          ? row.final_category
          : computedCategory;
        return finalCategory === "gamma";
      }).length,
    };

    await db.execute(sql`
    UPDATE amcat_sessions
    SET
      score_weights = ${JSON.stringify(newWeights)}::jsonb,
      category_thresholds = ${JSON.stringify(newThresholds)}::jsonb,
      alpha_count = ${distribution.alpha},
      beta_count = ${distribution.beta},
      gamma_count = ${distribution.gamma},
      status = CASE WHEN status = 'draft' THEN 'review' ELSE status END,
      updated_at = NOW()
    WHERE id = ${params.sessionId}
      AND college_id = ${session.user.collegeId}
  `);

    return NextResponse.json({
      success: true,
      distribution,
      message: `Recomputed ${results.length} results`,
    });
  } catch (error) {
    if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[POST /api/admin/amcat/[sessionId]/weights]", error);
    return NextResponse.json({ error: "Failed to recompute AMCAT session" }, { status: 500 });
  }
}
