import { NextRequest, NextResponse } from "next/server";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";

import { requireRole } from "@/lib/auth/helpers";
import { getRouter } from "@/lib/antigravity/instance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const adminSandboxSchema = z.object({
  prompt: z.string().min(10).max(12000),
  taskType: z.enum(["career_advice", "enhance_jd", "generate_questions", "sandbox_feedback"]).optional().default("career_advice"),
  responseFormat: z.enum(["text", "json"]).optional().default("text"),
  diagnosticsOnly: z.boolean().optional().default(false),
  modelOverride: z.string().trim().min(1).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["admin"]);
    const body = await req.json();
    const parsed = adminSandboxSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    if (payload.diagnosticsOnly) {
      return NextResponse.json({
        ok: true,
        actor: { id: user.id, role: user.role, collegeId: user.collegeId },
        sandboxMode: "admin-diagnostics",
        taskType: payload.taskType,
        prompt: payload.prompt,
        debug: {
          modelOverrideRequested: payload.modelOverride ?? null,
          modelOverrideApplied: false,
          component: "admin-sandbox",
          metadata: payload.metadata ?? null,
        },
      });
    }

    const router = getRouter();
    const result = await router.execute(
      payload.taskType,
      payload.prompt,
      {
        responseFormat: payload.responseFormat,
        temperature: 0.2,
        maxTokens: 1800,
      },
    );

    if (!result.success) {
      return NextResponse.json(
        {
          message: result.error ?? "Admin sandbox execution failed",
          blocked: result.blocked ?? false,
          modelUsed: result.modelUsed ?? null,
          sandboxMode: "admin-live",
        },
        { status: result.blocked ? 400 : 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      actor: { id: user.id, role: user.role, collegeId: user.collegeId },
      sandboxMode: "admin-live",
      taskType: payload.taskType,
      prompt: payload.prompt,
      modelUsed: result.modelUsed ?? null,
      result: result.data,
      debug: {
        modelOverrideRequested: payload.modelOverride ?? null,
        modelOverrideApplied: false,
        component: "admin-sandbox",
        metadata: payload.metadata ?? null,
      },
    });
  } catch (error) {
    if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ message: "Admin sandbox failed" }, { status: 500 });
  }
}
