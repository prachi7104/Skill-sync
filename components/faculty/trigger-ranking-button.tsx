"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TriggerRankingButtonProps {
    driveId: string;
    initialStatus: "pending" | "ranked" | "processing" | "closed";
}

type ButtonState = "idle" | "loading" | "queued" | "error" | "already_processing" | "ranked";

export function TriggerRankingButton({ driveId, initialStatus }: TriggerRankingButtonProps) {
    const [state, setState] = useState<ButtonState>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (initialStatus === "processing") {
            setState("already_processing");
        } else if (initialStatus === "ranked" || initialStatus === "closed") {
            setState("ranked");
        }
    }, [initialStatus]);

    async function handleTrigger() {
        setState("loading");
        setErrorMessage(null);

        try {
            const res = await fetch(`/api/drives/${driveId}/rank`, {
                method: "POST",
            });

            if (res.status === 202) {
                setState("queued");
                setTimeout(() => {
                    setState("already_processing");
                }, 3000);
            } else if (res.status === 409) {
                setState("already_processing");
            } else if (!res.ok) {
                const data = await res.json();
                throw new Error(
                    data.error ||
                    data.reason ||
                    data.message ||
                    "Failed to trigger ranking",
                );
            } else {
                // Unexpected success (usually 202)
                setState("queued");
                setTimeout(() => {
                    setState("already_processing");
                }, 3000);
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setState("error");
            setErrorMessage(err.message || "Something went wrong");
        }
    }

    if (state === "ranked") {
        return (
            <Button variant="outline" size="sm" disabled className="gap-2 bg-gray-50 text-gray-500 border-gray-200">
                Ranked <CheckCircle2 className="h-4 w-4" />
            </Button>
        );
    }

    if (state === "already_processing") {
        return (
            <Button variant="outline" size="sm" disabled className="gap-2 text-indigo-400 bg-indigo-50/50 border-indigo-100">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                In queue
            </Button>
        );
    }

    if (state === "queued") {
        return (
            <Button variant="outline" size="sm" disabled className="gap-2 bg-emerald-50 text-emerald-600 border-emerald-200">
                Queued <CheckCircle2 className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <div className="flex flex-col items-end gap-1.5">
            <Button
                variant={state === "error" ? "destructive" : "default"}
                size="sm"
                disabled={state === "loading"}
                onClick={handleTrigger}
                className={cn(
                    "gap-2 min-w-[140px]",
                    state === "idle" && "bg-indigo-600 hover:bg-indigo-700"
                )}
            >
                {state === "loading" ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Queuing...
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
            {state === "error" && errorMessage && (
                <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errorMessage}
                </span>
            )}
        </div>
    );
}
