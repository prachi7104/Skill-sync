import { NextRequest, NextResponse } from "next/server";
import { isRedirectError } from "next/dist/client/components/redirect";
import { z } from "zod";

import { getRouter } from "@/lib/antigravity/instance";
import { hasComponent, requireRole } from "@/lib/auth/helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const facultySandboxSchema = z.object({
  prompt: z.string().min(10).max(12000),
  taskType: z.enum(["career_advice", "enhance_jd", "generate_questions", "sandbox_feedback"]).optional().default("career_advice"),
  responseFormat: z.enum(["text", "json"]).optional().default("text"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["faculty", "admin"]);
    if (user.role === "faculty") {
      const hasAccess = await hasComponent("sandbox_access");
      if (!hasAccess) {
        return NextResponse.json({ message: "Permission denied: sandbox_access required" }, { status: 403 });
      }
    }

    const body = await req.json();
    const parsed = facultySandboxSchema.safeParse(body);
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
    const router = getRouter();
    const result = await router.execute(
      payload.taskType,
      payload.prompt,
      {
        responseFormat: payload.responseFormat,
        temperature: 0.2,
        maxTokens: 1600,
      },
    );

    if (!result.success) {
      return NextResponse.json(
        {
          message: result.error ?? "Faculty sandbox execution failed",
          blocked: result.blocked ?? false,
          modelUsed: result.modelUsed ?? null,
        },
        { status: result.blocked ? 400 : 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      taskType: payload.taskType,
      modelUsed: result.modelUsed ?? null,
      result: result.data,
    });
  } catch (error) {
    if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ message: "Faculty sandbox failed" }, { status: 500 });
  }
}
