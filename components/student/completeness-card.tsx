"use client";

import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Lock } from "lucide-react";

interface CompletenessCardProps {
    score: number;
    isBlocked: boolean;
    isGated: boolean;
    missing: string[];
    blocked: string[];
}

export function CompletenessCard({
    score,
    isBlocked,
    isGated,
    missing,
    blocked,
}: CompletenessCardProps) {
    const color = score >= 70 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
    const label = score >= 70 ? "Ready for placements" : score >= 50 ? "Almost ready" : "Needs attention";

    return (
        <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Profile Strength</h3>
                <Badge variant={score >= 70 ? "default" : "destructive"}>
                    {score}/100
                </Badge>
            </div>

            <Progress value={score} className="h-3" />

            <p className={`text-sm font-medium ${color}`}>
                {isBlocked ? (
                    <span className="flex items-center gap-1">
                        <Lock className="w-4 h-4" /> Placement features locked
                    </span>
                ) : (
                    <span className="flex items-center gap-1">
                        {score >= 70
                            ? <CheckCircle className="w-4 h-4 text-green-600" />
                            : <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        }
                        {label}
                    </span>
                )}
            </p>

            {isBlocked && blocked.length > 0 && (
                <Alert variant="destructive">
                    <AlertDescription>
                        <strong>Required to unlock placement features:</strong>
                        <ul className="mt-1 list-disc pl-4 space-y-1">
                            {blocked.map((b) => <li key={b} className="text-sm">{b}</li>)}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {!isBlocked && isGated && missing.length > 0 && (
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Top suggestions to unlock features:</p>
                    <ul className="space-y-1">
                        {missing.map((m) => (
                            <li key={m} className="text-sm text-muted-foreground flex items-start gap-1">
                                <span className="text-yellow-500 mt-0.5">→</span> {m}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
