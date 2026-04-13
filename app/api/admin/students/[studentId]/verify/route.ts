import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const admin = await requireRole(["admin"]);

    if (!admin.collegeId) {
      return NextResponse.json({ error: "No college linked" }, { status: 400 });
    }

    const body = await req.json();
    const { status, sapId } = body as {
      status: "admin_verified" | "flagged";
      sapId?: string;
    };

    if (!["admin_verified", "flagged"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [student] = await db
      .select({ id: students.id, collegeId: students.collegeId })
      .from(students)
      .where(
        and(
          eq(students.id, params.studentId),
          eq(students.collegeId, admin.collegeId)
        )
      )
      .limit(1);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      verificationStatus: status,
      updatedAt: new Date(),
    };

    if (sapId && status === "admin_verified") {
      if (!/^(500|590)\d{6}$/.test(sapId)) {
        return NextResponse.json(
          { error: "SAP ID must be 9 digits starting with 500 or 590" },
          { status: 400 }
        );
      }

      updateData.sapId = sapId;
      updateData.sapIdLocked = true;
    }

    await db
      .update(students)
      .set(updateData as any)
      .where(eq(students.id, params.studentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Verify Student] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}