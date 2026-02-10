import { NextResponse } from "next/server";
import { getDbStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
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
