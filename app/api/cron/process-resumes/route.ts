
import { NextRequest, NextResponse } from "next/server";
import { processResumeParseJobs } from "@/lib/workers/parse-resume";

export const dynamic = 'force-dynamic'; // Ensure this route is never cached

// Secret key for cron authentication (should be set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
    try {
        // Security: Verify cron secret to prevent unauthorized access
        const authHeader = req.headers.get("authorization");
        const providedSecret = authHeader?.replace("Bearer ", "");

        if (!CRON_SECRET) {
            console.error("CRON_SECRET not configured in environment");
            return NextResponse.json(
                { error: "Cron endpoint not configured" },
                { status: 503 }
            );
        }

        if (providedSecret !== CRON_SECRET) {
            console.warn("Unauthorized cron attempt");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        console.log("Triggering resume parse worker...");
        await processResumeParseJobs();

        return NextResponse.json({ message: "Worker executed" }, { status: 200 });
    } catch (error: any) {
        console.error("Worker failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
