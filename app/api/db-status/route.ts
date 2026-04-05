import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getDbStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const stats = await getDbStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error("Failed to fetch DB stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch DB stats" },
            { status: 500 }
        );
    }
}
