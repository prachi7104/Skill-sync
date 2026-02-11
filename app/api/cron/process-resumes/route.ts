
import { NextRequest, NextResponse } from "next/server";
import { processResumeParseJobs } from "@/lib/workers/parse-resume";

export const dynamic = 'force-dynamic'; // Ensure this route is never cached

// Secret key for cron authentication (should be set in environment variables)


export async function GET(req: NextRequest) {
    try {
        // Security: Verify cron secret to prevent unauthorized access
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }

        console.log("Triggering resume parse worker...");
        const processed = await processResumeParseJobs();

        return NextResponse.json({ message: "Worker executed", processed }, { status: 200 });
    } catch (error: any) {
        console.error("Worker failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
