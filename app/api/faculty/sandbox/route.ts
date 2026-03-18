import { NextRequest, NextResponse } from "next/server";
import { isRedirectError } from "next/dist/client/components/redirect";

import { requireRole } from "@/lib/auth/helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["faculty", "admin"]);
    const body = await req.json();

    return NextResponse.json({
      ok: true,
      actor: { id: user.id, role: user.role, collegeId: user.collegeId },
      sandboxMode: "faculty",
      prompt: body.prompt ?? "",
      debug: {
        modelOverride: body.modelOverride ?? null,
        component: "faculty-sandbox",
      },
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return NextResponse.json({ message: "Faculty sandbox failed" }, { status: 500 });
  }
}
