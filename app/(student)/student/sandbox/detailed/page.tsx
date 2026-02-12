
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Upload, FileText, CheckCircle, AlertTriangle, ArrowRight,
    Target, Zap, BookOpen, Shield, ChevronDown, ChevronUp,
    TrendingUp, XCircle, AlertCircle, Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import {
    DetailedAnalysisResult,
    ScoreBreakdown,
    CategorizedSkill,
    ActionableFeedback
} from "@/lib/ats/detailed-analysis";
import { extractTextFromResume, cleanResumeText } from "@/lib/resume/text-extractor";

// ============================================================================
// RADAR CHART (Pure CSS/SVG — no external dependency)
// ============================================================================

function RadarChart({ breakdown, label }: { breakdown: ScoreBreakdown; label: string }) {
    const dimensions = [
        { key: "hardSkills", label: "Hard Skills (20%)", value: breakdown.hardSkills },
        { key: "softSkills", label: "Soft Skills (10%)", value: breakdown.softSkills },
        { key: "experience", label: "Experience (10%)", value: breakdown.experience },
        { key: "domainMatch", label: "Domain Match (60%)", value: breakdown.domainMatch },
    ];

    const cx = 120, cy = 120, maxR = 90;
    const n = dimensions.length;

    // Grid circles
    const gridCircles = [25, 50, 75, 100].map(pct => (
        <circle
            key={pct}
            cx={cx} cy={cy} r={maxR * pct / 100}
            fill="none" stroke="currentColor" strokeWidth="0.5"
            className="text-gray-200 dark:text-gray-700"
        />
    ));

    // Compute polygon points
    const points = dimensions.map((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = (d.value / 100) * maxR;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });

    const polygon = points.map(p => `${p.x},${p.y}`).join(" ");

    // Axis lines and labels
    const axes = dimensions.map((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const endX = cx + maxR * Math.cos(angle);
        const endY = cy + maxR * Math.sin(angle);
        const labelX = cx + (maxR + 20) * Math.cos(angle);
        const labelY = cy + (maxR + 20) * Math.sin(angle);
        return (
            <g key={d.key}>
                <line x1={cx} y1={cy} x2={endX} y2={endY}
                    stroke="currentColor" strokeWidth="0.5"
                    className="text-gray-300 dark:text-gray-600" />
                <text x={labelX} y={labelY}
                    textAnchor="middle" dominantBaseline="middle"
                    className="fill-gray-600 dark:fill-gray-400 text-[10px] font-medium">
                    {d.label}
                </text>
            </g>
        );
    });

    return (
        <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</span>
            <svg viewBox="0 0 240 240" className="w-full max-w-[220px]">
                {gridCircles}
                {axes}
                <polygon
                    points={polygon}
                    fill="hsl(var(--primary) / 0.15)"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                />
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3"
                        fill="hsl(var(--primary))" />
                ))}
            </svg>
        </div>
    );
}

// ============================================================================
// SCORE BAR — Animated horizontal bar with label
// ============================================================================

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                <span className="font-semibold" style={{ color }}>{value}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${value}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

// ============================================================================
// SKILL CHIP — Visual indicator of skill match status
// ============================================================================

function SkillChip({ skill }: { skill: CategorizedSkill }) {
    const config = {
        matched: { bg: "bg-emerald-50 dark:bg-emerald-950", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300", icon: CheckCircle },
        missing: { bg: "bg-red-50 dark:bg-red-950", border: "border-red-200 dark:border-red-800", text: "text-red-700 dark:text-red-300", icon: XCircle },
        partial: { bg: "bg-amber-50 dark:bg-amber-950", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300", icon: AlertCircle },
    }[skill.status];

    const Icon = config.icon;
    const evidenceStars = "●".repeat(skill.evidenceLevel) + "○".repeat(4 - skill.evidenceLevel);

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bg} ${config.border}`}>
            <Icon className={`h-4 w-4 shrink-0 ${config.text}`} />
            <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium ${config.text}`}>{skill.skill}</div>
                {skill.status === "matched" && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="text-amber-500 tracking-wider text-[10px]">{evidenceStars}</span>
                        <span className="truncate">{skill.evidenceDetail}</span>
                    </div>
                )}
            </div>
            <Badge variant={skill.impact === "Critical" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                {skill.impact}
            </Badge>
        </div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function DetailedSandboxPage() {
    const [jdText, setJdText] = useState("");
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DetailedAnalysisResult | null>(null);
    const [showAllFeedback, setShowAllFeedback] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File must be less than 5MB");
                return;
            }
            if (file.type !== "application/pdf" && !file.type.includes("wordprocessing")) {
                toast.error("Only PDF and DOCX files are supported");
                return;
            }
            setResumeFile(file);
        }
    };

    const handleAnalyze = async () => {
        if (!resumeFile || jdText.trim().length < 50) {
            toast.error("Please provide both a resume and a detailed Job Description");
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            toast.info("Extracting resume text...");
            const rawText = await extractTextFromResume(resumeFile);
            const resumeText = cleanResumeText(rawText);

            if (!resumeText || resumeText.length < 50) {
                throw new Error("Could not extract meaningful text from this file.");
            }

            const res = await fetch("/api/student/sandbox/detailed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeText, jdText }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Analysis failed");
            }

            setResult(data.data as DetailedAnalysisResult);
            toast.success("Analysis complete!");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    function getScoreColor(score: number): string {
        if (score >= 75) return "#16a34a";
        if (score >= 50) return "#ca8a04";
        if (score >= 25) return "#ea580c";
        return "#dc2626";
    }

    function getScoreLabel(score: number): string {
        if (score >= 85) return "Strong Match";
        if (score >= 65) return "Interview";
        if (score >= 50) return "Consider";
        return "Weak Match";
    }

    // Memoize grouped skills
    const groupedSkills = useMemo(() => {
        if (!result) return { matched: [], missing: [] };
        return {
            matched: result.categorizedSkills.filter(s => s.status === "matched"),
            missing: result.categorizedSkills.filter(s => s.status === "missing" || s.status === "partial"),
        };
    }, [result]);

    const visibleFeedback = useMemo(() => {
        if (!result) return [];
        return showAllFeedback ? result.actionableFeedback : result.actionableFeedback.slice(0, 5);
    }, [result, showAllFeedback]);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">

            {/* ─── INPUT SECTION ─── */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Upload Resume
                            </CardTitle>
                            <CardDescription>PDF or DOCX (Max 5MB)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <label className="cursor-pointer block">
                                <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all ${resumeFile ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : "border-gray-300 hover:border-gray-400 dark:border-gray-700"}`}>
                                    {resumeFile ? (
                                        <>
                                            <FileText className="h-8 w-8 text-emerald-600 mb-2" />
                                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate max-w-[200px]">{resumeFile.name}</span>
                                            <span className="text-xs text-emerald-600 mt-1">Click to change</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">Click to upload</span>
                                        </>
                                    )}
                                    <Input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </label>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Job Description
                            </CardTitle>
                            <CardDescription>Paste the full JD text</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Paste JD content here..."
                                className="min-h-[160px] resize-none"
                                value={jdText}
                                onChange={(e) => setJdText(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col">
                    {!result ? (
                        <Card className="flex-1 flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 border-dashed">
                            <CardContent className="text-center py-12">
                                <Target className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ready to Analyze</h3>
                                <p className="text-sm text-gray-500 max-w-sm mt-2">
                                    Upload your resume and paste a JD to see a detailed breakdown of how well you match.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        /* ─── OVERALL SCORES ─── */
                        <Card className="flex-1">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Overall Match</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Resume Score */}
                                <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                                    <div className="text-4xl font-bold" style={{ color: getScoreColor(result.resumeMatchScore) }}>
                                        {result.resumeMatchScore}%
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Resume Match</div>
                                    <Badge variant="outline" className="mt-2 text-xs" style={{ borderColor: getScoreColor(result.resumeMatchScore), color: getScoreColor(result.resumeMatchScore) }}>
                                        {result.recommendation?.replace("_", " ") || getScoreLabel(result.resumeMatchScore)}
                                    </Badge>
                                </div>

                                {/* Profile Score */}
                                <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                                    <div className="text-3xl font-bold" style={{ color: getScoreColor(result.profileMatchScore) }}>
                                        {result.profileMatchScore}%
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Profile Potential</div>
                                    <Badge variant="outline" className="mt-2 text-xs" style={{ borderColor: getScoreColor(result.profileMatchScore), color: getScoreColor(result.profileMatchScore) }}>
                                        {getScoreLabel(result.profileMatchScore)}
                                    </Badge>
                                </div>

                                {result.profileMatchScore > result.resumeMatchScore + 5 && (
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                                        <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                        <p className="text-xs text-blue-700 dark:text-blue-300">
                                            Your profile shows {result.profileMatchScore - result.resumeMatchScore}% more potential than your resume reflects. Tailor your resume to close this gap.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Button
                        size="lg"
                        className="w-full mt-4"
                        onClick={handleAnalyze}
                        disabled={isLoading || !resumeFile || jdText.length < 50}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                Analyzing...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Run Detailed Analysis
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* ─── RESULTS SECTION ─── */}
            {result && (
                <div className="space-y-6">

                    {/* ─── RADAR CHARTS ─── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Score Breakdown
                            </CardTitle>
                            <CardDescription>
                                How each dimension contributes to your match score
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-8">
                                <RadarChart breakdown={result.resumeScoreBreakdown} label="Resume" />
                                <RadarChart breakdown={result.profileScoreBreakdown} label="Profile" />
                            </div>

                            {/* Dimension bars for resume */}
                            <div className="mt-8 space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Resume Dimension Scores</h4>
                                <ScoreBar label="Hard Skills (20%)" value={result.resumeScoreBreakdown.hardSkills} color={getScoreColor(result.resumeScoreBreakdown.hardSkills)} />
                                <ScoreBar label="Soft Skills (10%)" value={result.resumeScoreBreakdown.softSkills} color={getScoreColor(result.resumeScoreBreakdown.softSkills)} />
                                <ScoreBar label="Experience Level (10%)" value={result.resumeScoreBreakdown.experience} color={getScoreColor(result.resumeScoreBreakdown.experience)} />
                                <ScoreBar label="Domain Match (60%)" value={result.resumeScoreBreakdown.domainMatch} color={getScoreColor(result.resumeScoreBreakdown.domainMatch)} />
                            </div>

                            {/* Red Flags */}
                            {result.redFlags && result.redFlags.length > 0 && (
                                <div className="mt-6 space-y-2">
                                    <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Red Flags ({result.redFlags.length})
                                    </h4>
                                    {result.redFlags.map((rf, i) => (
                                        <div key={i} className={`flex items-start gap-2 p-3 rounded-lg border ${rf.severity === "Critical"
                                            ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                                            : "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
                                            }`}>
                                            <XCircle className={`h-4 w-4 mt-0.5 shrink-0 ${rf.severity === "Critical" ? "text-red-600" : "text-amber-600"
                                                }`} />
                                            <div>
                                                <span className={`text-xs font-semibold ${rf.severity === "Critical" ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"
                                                    }`}>{rf.severity}</span>
                                                <p className={`text-xs ${rf.severity === "Critical" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                                                    }`}>{rf.flag} ({rf.impact} pts)</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ─── SKILL MATCH MAP ─── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Skill Match Map
                            </CardTitle>
                            <CardDescription>
                                {groupedSkills.matched.length} matched · {groupedSkills.missing.length} missing
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Matched */}
                                <div>
                                    <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Matched ({groupedSkills.matched.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {groupedSkills.matched.map((s, i) => (
                                            <SkillChip key={i} skill={s} />
                                        ))}
                                        {groupedSkills.matched.length === 0 && (
                                            <p className="text-sm text-gray-400 italic">No skills matched</p>
                                        )}
                                    </div>
                                </div>

                                {/* Missing */}
                                <div>
                                    <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-1">
                                        <XCircle className="h-3.5 w-3.5" />
                                        Missing ({groupedSkills.missing.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {groupedSkills.missing.map((s, i) => (
                                            <SkillChip key={i} skill={s} />
                                        ))}
                                        {groupedSkills.missing.length === 0 && (
                                            <p className="text-sm text-emerald-600 italic flex items-center gap-1">
                                                <CheckCircle className="h-3.5 w-3.5" /> All required skills matched!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ─── ACTIONABLE FEEDBACK ─── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-amber-500" />
                                Actionable Feedback
                            </CardTitle>
                            <CardDescription>
                                {result.actionableFeedback.length} suggestions to improve your match
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {visibleFeedback.map((fb, i) => (
                                    <FeedbackItem key={i} feedback={fb} />
                                ))}
                            </div>
                            {result.actionableFeedback.length > 5 && (
                                <Button
                                    variant="ghost" size="sm"
                                    className="mt-3 w-full text-xs"
                                    onClick={() => setShowAllFeedback(!showAllFeedback)}
                                >
                                    {showAllFeedback ? (
                                        <><ChevronUp className="h-3 w-3 mr-1" /> Show less</>
                                    ) : (
                                        <><ChevronDown className="h-3 w-3 mr-1" /> Show {result.actionableFeedback.length - 5} more</>
                                    )}
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* ─── MISSED OPPORTUNITIES ─── */}
                    {result.missedOpportunities.length > 0 && (
                        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                    <CardTitle className="text-base text-amber-900 dark:text-amber-200">
                                        Missed Opportunities ({result.missedOpportunities.length})
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-amber-700 dark:text-amber-400">
                                    Skills in your Profile &amp; JD, but <strong>missing</strong> from your Resume.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {result.missedOpportunities.map((miss, idx) => (
                                        <div key={idx} className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-amber-100 dark:border-amber-900 flex items-start gap-3">
                                            <ArrowRight className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{miss.skill}</div>
                                                <p className="text-xs text-gray-500 mt-0.5">{miss.reason}</p>
                                            </div>
                                            <Badge variant={miss.impact === "High" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                                                {miss.impact}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// FEEDBACK ITEM COMPONENT
// ============================================================================

function FeedbackItem({ feedback }: { feedback: ActionableFeedback }) {
    const iconMap = {
        add_skill: { icon: XCircle, color: "text-red-500" },
        strengthen_evidence: { icon: TrendingUp, color: "text-amber-500" },
        highlight_project: { icon: Lightbulb, color: "text-blue-500" },
        tailor_resume: { icon: Target, color: "text-purple-500" },
    };

    const { icon: Icon, color } = iconMap[feedback.type];
    const priorityStyles = {
        High: "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
        Medium: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
        Low: "border-l-gray-300 bg-gray-50/50 dark:bg-gray-900/50",
    };

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${priorityStyles[feedback.priority]}`}>
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
            <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200">{feedback.message}</p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">
                {feedback.priority}
            </Badge>
        </div>
    );
}
