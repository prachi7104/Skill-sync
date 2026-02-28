"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TriggerRankingButtonProps {
    driveId: string;
    initialStatus: "pending" | "ranked" | "processing" | "closed";
}

type ButtonState = "idle" | "loading" | "success" | "error" | "processing";

export function TriggerRankingButton({ driveId, initialStatus }: TriggerRankingButtonProps) {
    const router = useRouter();

    const [state, setState] = useState<ButtonState>(
        initialStatus === "processing" ? "processing" : "idle"
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Drives that already have rankings start in a visually distinct "re-rank" mode,
    // but faculty can still click — this is handled via the isRerank flag.
    const isRerank = state === "idle" && (initialStatus === "ranked" || initialStatus === "closed");

    async function handleTrigger() {
        setState("loading");
        setErrorMessage(null);

        try {
            const res = await fetch(`/api/drives/${driveId}/rank`, {
                method: "POST",
            });

            if (res.status === 200) {
                setState("success");
                // Show "Rankings Updated ✓" for 3 seconds, then refresh
                setTimeout(() => {
                    router.refresh();
                    setState("idle");
                }, 3000);
            } else if (res.status === 409 || res.status === 403) {
                // Already actively processing (job in flight)
                setState("processing");
            } else {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || data.message || "Failed to trigger ranking");
            }
        } catch (err: unknown) {
            setState("error");
            setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
        }
    }

    // ── Locked / in-queue state ───────────────────────────────────────────────
    if (state === "processing") {
        return (
            <Button variant="outline" size="sm" disabled className="gap-2 text-indigo-400 bg-indigo-50/50 border-indigo-100">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                In queue...
            </Button>
        );
    }

    // ── Post-success flash ────────────────────────────────────────────────────
    if (state === "success") {
        return (
            <Button
                variant="default"
                size="sm"
                disabled
                className="gap-2 min-w-[160px] bg-emerald-600 text-white border-0 cursor-default"
            >
                <CheckCircle2 className="h-4 w-4" />
                Rankings Updated ✓
            </Button>
        );
    }

    // ── Re-rank (rankings already exist) ─────────────────────────────────────
    if (isRerank) {
        return (
            <div className="flex flex-col items-end gap-1.5">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTrigger}
                    title="Updates rankings with newly onboarded students"
                    className="gap-2 min-w-[160px] border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Re-rank Students
                </Button>
            </div>
        );
    }

    // ── Primary trigger / error / loading ────────────────────────────────────
    return (
        <div className="flex flex-col items-end gap-1.5">
            <Button
                variant={state === "error" ? "destructive" : "default"}
                size="sm"
                disabled={state === "loading"}
                onClick={handleTrigger}
                className={cn(
                    "gap-2 min-w-[160px]",
                    state === "idle" && "bg-indigo-600 hover:bg-indigo-700",
                )}
            >
                {state === "loading" ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : state === "error" ? (
                    <>
                        Retry <Play className="h-3 w-3" />
                    </>
                ) : (
                    <>
                        Trigger Ranking <Play className="h-3 w-3 fill-current" />
                    </>
                )}
            </Button>
            {state === "loading" && (
                <span className="text-[10px] text-slate-500 font-medium">
                    Generating rankings… (may take up to 45s)
                </span>
            )}
            {state === "error" && errorMessage && (
                <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errorMessage}
                </span>
            )}
        </div>
    );
}
