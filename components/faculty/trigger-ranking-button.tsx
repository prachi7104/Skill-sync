"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TriggerRankingButtonProps {
    driveId: string;
    initialStatus: "pending" | "ranked" | "processing" | "closed" | "jd_analyzing";
    jdReady: boolean;
}

type ButtonState = "idle" | "loading" | "queued" | "error" | "already_processing" | "ranked";

export function TriggerRankingButton({ driveId, initialStatus, jdReady }: TriggerRankingButtonProps) {
    const [state, setState] = useState<ButtonState>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [embeddingCheck, setEmbeddingCheck] = useState<{
        total: number;
        withEmbedding: number;
        loading: boolean;
    } | null>(null);

    useEffect(() => {
        if (initialStatus === "processing") {
            setState("already_processing");
        } else if (initialStatus === "ranked" || initialStatus === "closed") {
            setState("ranked");
        }
    }, [initialStatus]);

    useEffect(() => {
        checkEmbeddings().catch(() => undefined);
    }, [driveId]);

    async function checkEmbeddings() {
        setEmbeddingCheck((prev) => ({
            total: prev?.total ?? 0,
            withEmbedding: prev?.withEmbedding ?? 0,
            loading: true,
        }));
        const res = await fetch(`/api/drives/${driveId}/embedding-check`);
        if (res.ok) {
            const data = await res.json();
            setEmbeddingCheck({
                total: data.total ?? 0,
                withEmbedding: data.withEmbedding ?? 0,
                loading: false,
            });
        } else {
            setEmbeddingCheck((prev) =>
                prev ? { ...prev, loading: false } : { total: 0, withEmbedding: 0, loading: false },
            );
        }
    }

    async function queueMissingEmbeddings() {
        try {
            const res = await fetch(`/api/drives/${driveId}/queue-embeddings`, {
                method: "POST",
            });
            if (!res.ok) {
                throw new Error("Failed to queue missing embeddings");
            }
            await checkEmbeddings();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setErrorMessage(err.message || "Unable to queue embeddings");
        }
    }

    async function handleTrigger() {
        await checkEmbeddings().catch(() => undefined);
        setState("loading");
        setErrorMessage(null);

        try {
            const res = await fetch(`/api/drives/${driveId}/rank`, {
                method: "POST",
            });

            if (res.status === 200) {
                // Ranking completed synchronously
                setState("ranked");
                // Refresh the page to show rankings
                setTimeout(() => window.location.reload(), 1000);
            } else if (res.status === 202) {
                setState("queued");
                // Poll for completion every 5 seconds
                const pollInterval = setInterval(async () => {
                    const statusRes = await fetch(`/api/drives/${driveId}/rank/status`);
                    if (statusRes.ok) {
                        const { status } = await statusRes.json();
                        if (status === "completed") {
                            clearInterval(pollInterval);
                            setState("ranked");
                            setTimeout(() => window.location.reload(), 500);
                        } else if (status === "failed") {
                            clearInterval(pollInterval);
                            setState("error");
                            setErrorMessage("Ranking failed. Please try again.");
                        }
                    }
                }, 5000);
                // Stop polling after 3 minutes
                setTimeout(() => clearInterval(pollInterval), 180000);
            } else {
                const data = await res.json().catch(() => ({}));
                throw new Error(
                    data.error ||
                    data.reason ||
                    data.message ||
                    "Failed to trigger ranking"
                );
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setState("error");
            setErrorMessage(err.message || "Something went wrong");
        }
    }

    if (!jdReady) {
        return (
            <Button variant="outline" size="sm" disabled className="gap-2 text-violet-400 bg-violet-500/10 border-violet-500/20">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing JD... (~3 min)
            </Button>
        );
    }

    if (state === "ranked") {
        return (
            <Button variant="outline" size="sm" disabled className="gap-2 bg-card text-muted-foreground border-border">
                Ranked <CheckCircle2 className="h-4 w-4" />
            </Button>
        );
    }

    if (state === "already_processing") {
        return (
            <Button variant="outline" size="sm" disabled className="gap-2 text-primary bg-primary/10 border-primary/30">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/10 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                In queue
            </Button>
        );
    }

    if (state === "queued") {
        return (
            <Button variant="outline" size="sm" disabled className="gap-2 bg-success/10 text-success border-success/20">
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
                    state === "idle" && "bg-primary hover:bg-primary"
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
                <span className="text-[10px] text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errorMessage}
                </span>
            )}
            {embeddingCheck && !embeddingCheck.loading && embeddingCheck.withEmbedding < embeddingCheck.total && (
                <div className="mt-2 w-full rounded-md border border-warning/20 bg-warning/10 p-3 text-left">
                    <p className="text-sm font-medium text-warning">
                        {embeddingCheck.total - embeddingCheck.withEmbedding} of {embeddingCheck.total} eligible students have no embedding yet.
                    </p>
                    <p className="mt-1 text-xs text-warning/70">
                        These students will be skipped in ranking. You can queue their embeddings now and retry shortly.
                    </p>
                    <button
                        type="button"
                        onClick={queueMissingEmbeddings}
                        className="mt-2 text-xs text-warning underline hover:text-warning"
                    >
                        Queue missing embeddings now
                    </button>
                </div>
            )}
        </div>
    );
}
