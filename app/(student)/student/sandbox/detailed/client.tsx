"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Upload, FileText, AlertTriangle, ArrowRight,
    Target, Zap, BookOpen, Shield,
    TrendingUp, XCircle, AlertCircle, Lightbulb, CheckCircle2,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
    DetailedAnalysisResult, ScoreBreakdown, CategorizedSkill, ActionableFeedback
} from "@/lib/ats/detailed-analysis";
import { extractTextFromResume, cleanResumeText } from "@/lib/resume/text-extractor";

// --- Radar Chart (semantic colors) ---
function RadarChart({ breakdown, label }: { breakdown: ScoreBreakdown; label: string }) {
    const dimensions = [
        { key: "hardSkills", label: "Hard Skills", value: breakdown.hardSkills },
        { key: "softSkills", label: "Soft Skills", value: breakdown.softSkills },
        { key: "experience", label: "Experience", value: breakdown.experience },
        { key: "domainMatch", label: "Domain", value: breakdown.domainMatch },
    ];

    const cx = 120, cy = 120, maxR = 90, n = dimensions.length;

    const gridCircles = [25, 50, 75, 100].map(pct => (
        <circle key={pct} cx={cx} cy={cy} r={maxR * pct / 100} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
    ));

    const points = dimensions.map((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = (d.value / 100) * maxR;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });

    const polygon = points.map(p => `${p.x},${p.y}`).join(" ");

    const axes = dimensions.map((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const endX = cx + maxR * Math.cos(angle);
        const endY = cy + maxR * Math.sin(angle);
        const labelX = cx + (maxR + 25) * Math.cos(angle);
        const labelY = cy + (maxR + 20) * Math.sin(angle);
        return (
            <g key={d.key}>
                <line x1={cx} y1={cy} x2={endX} y2={endY} stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/30" />
                <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-widest">
                    {d.label}
                </text>
            </g>
        );
    });

    return (
        <div className="flex flex-col items-center rounded-lg border border-border bg-card p-6">
            <span className="text-sm font-semibold text-foreground tracking-tight mb-4">{label} Breakdown</span>
            <svg viewBox="0 0 240 240" className="w-full max-w-[240px]">
                {gridCircles}
                {axes}
                <polygon points={polygon} className="fill-primary/20 stroke-primary" strokeWidth="2" />
                {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" className="fill-primary" />)}
            </svg>
        </div>
    );
}

function ScoreBar({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground">{value.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden border border-border bg-muted">
                <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function SkillChip({ skill }: { skill: CategorizedSkill }) {
    const config = {
        matched: { bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
        missing: { bg: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400", icon: XCircle },
        partial: { bg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400", icon: AlertCircle },
    }[skill.status];

    const Icon = config.icon;
    const evidenceStars = "★".repeat(skill.evidenceLevel) + "☆".repeat(4 - skill.evidenceLevel);

    return (
        <div className={`flex items-center justify-between gap-4 px-4 py-3 rounded-md border ${config.bg}`}>
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0" />
                <div>
                    <div className="text-sm font-semibold">{skill.skill}</div>
                    {skill.status === "matched" && (
                        <div className="text-[10px] font-medium opacity-80 mt-0.5 flex gap-1.5 items-center">
                            <span className="text-amber-500">{evidenceStars}</span> {skill.evidenceDetail}
                        </div>
                    )}
                </div>
            </div>
            <span className="text-[9px] uppercase tracking-widest font-semibold px-2 py-1 rounded bg-muted shrink-0">
                {skill.impact} Impact
            </span>
        </div>
    );
}

export default function DetailedSandboxClient() {
    const [jdText, setJdText] = useState("");
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DetailedAnalysisResult | null>(null);
    const [showAllFeedback, setShowAllFeedback] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) return toast.error("File must be less than 5MB");
            setResumeFile(file);
        }
    };

    const handleAnalyze = async () => {
        if (!resumeFile || jdText.trim().length < 50) return toast.error("Provide both a resume and a JD.");
        setIsLoading(true); setResult(null);

        try {
            toast.info("Parsing architecture...");
            const rawText = await extractTextFromResume(resumeFile);
            const resumeText = cleanResumeText(rawText);
            if (!resumeText || resumeText.length < 50) throw new Error("Could not extract meaningful text.");

            const res = await fetch("/api/student/sandbox/detailed", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeText, jdText }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Analysis failed");

            setResult(data.data as DetailedAnalysisResult);
            toast.success("Analysis complete!");
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    function getScoreColor(score: number) {
        if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
        if (score >= 50) return "text-amber-600 dark:text-amber-400";
        return "text-rose-600 dark:text-rose-400";
    }

    function getBarColor(score: number) {
        if (score >= 75) return "bg-emerald-500";
        if (score >= 50) return "bg-amber-500";
        return "bg-rose-500";
    }

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
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* INPUT GRID */}
            <div className="grid gap-6 lg:grid-cols-12 items-start">
                
                <div className="lg:col-span-5 space-y-6">
                    {/* Resume Upload */}
                    <div className="rounded-lg border border-border bg-card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-md"><FileText className="w-4 h-4 text-primary" /></div>
                            <h3 className="font-semibold text-foreground">Target Resume</h3>
                        </div>
                        <label className="cursor-pointer block">
                            <div className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-all ${resumeFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}>
                                {resumeFile ? (
                                    <>
                                        <FileText className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-3" />
                                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">{resumeFile.name}</span>
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-2">Click to change</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                                        <span className="text-sm font-semibold text-foreground mb-1">Upload PDF/DOCX</span>
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Max 5MB</span>
                                    </>
                                )}
                                <Input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                            </div>
                        </label>
                    </div>

                    {/* JD Text */}
                    <div className="rounded-lg border border-border bg-card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/10 rounded-md"><BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" /></div>
                            <h3 className="font-semibold text-foreground">Job Description</h3>
                        </div>
                        <Textarea placeholder="Paste full JD text here..." className="min-h-[220px] p-5 text-sm resize-y" value={jdText} onChange={(e) => setJdText(e.target.value)} />
                    </div>
                </div>

                {/* ACTION / HERO RAIL */}
                <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
                    {!result ? (
                        <div className="flex-1 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-center p-10 relative overflow-hidden bg-muted/30">
                            <div className="p-5 bg-card rounded-full border border-border mb-6 z-10">
                                <div className="p-4 bg-muted rounded-full">
                                    <Target className="w-8 h-8 text-muted-foreground" />
                                </div>
                            </div>
                            <h2 className="text-xl font-semibold text-foreground tracking-tight mb-2 z-10">Deep Analysis Engine</h2>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed z-10">Provide a resume and JD on the left to generate a multi-dimensional AI competency matrix.</p>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border bg-card p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-8 text-center">Engine Results</h3>
                            
                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                <div className="rounded-lg border border-border bg-background p-6 text-center">
                                    <div className={`text-5xl font-bold tracking-tighter ${getScoreColor(result.resumeMatchScore)}`}>{result.resumeMatchScore}%</div>
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-2 mb-3">Current Resume</div>
                                    <span className={`px-3 py-1 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${result.resumeMatchScore >= 75 ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'}`}>
                                        {result.recommendation?.replace("_", " ")}
                                    </span>
                                </div>
                                <div className="rounded-lg border border-border bg-background p-6 text-center">
                                    <div className={`text-5xl font-bold tracking-tighter ${getScoreColor(result.profileMatchScore)}`}>{result.profileMatchScore}%</div>
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-2 mb-3">True Potential</div>
                                    <span className="px-3 py-1 rounded-md border border-primary/30 text-primary bg-primary/10 text-[10px] font-semibold uppercase tracking-wider">
                                        Max Score
                                    </span>
                                </div>
                            </div>

                            {result.profileMatchScore > result.resumeMatchScore + 5 && (
                                <div className="mt-8 flex items-start gap-3 p-4 rounded-md bg-primary/10 border border-primary/20">
                                    <TrendingUp className="h-5 w-5 text-primary shrink-0" />
                                    <p className="text-sm font-medium text-foreground">
                                        Your profile shows <strong>{result.profileMatchScore - result.resumeMatchScore}% more potential</strong> than your resume currently reflects. Update your resume to close the gap!
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <Button
                        onClick={handleAnalyze} disabled={isLoading || !resumeFile || jdText.length < 50}
                        className="mt-6 w-full py-4"
                        size="lg"
                    >
                        {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing Vectors...</> : <><Zap className="w-5 h-5" /> Run Detailed Analysis</>}
                    </Button>
                </div>
            </div>

            {/* RESULTS UI */}
            {result && (
                <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-20">

                    {/* RADAR CHARTS */}
                    <div className="rounded-lg border border-border bg-card p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-blue-500/10 rounded-md"><Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                            <h2 className="font-semibold text-foreground text-xl">Dimensional Breakdown</h2>
                        </div>
                        
                        <div className="grid lg:grid-cols-2 gap-10">
                            <div className="flex justify-center"><RadarChart breakdown={result.resumeScoreBreakdown} label="Resume" /></div>
                            <div className="flex justify-center"><RadarChart breakdown={result.profileScoreBreakdown} label="Profile" /></div>
                        </div>

                        <Separator className="my-8" />

                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                            <ScoreBar label="Domain Match (60%)" value={result.resumeScoreBreakdown.domainMatch} colorClass={getBarColor(result.resumeScoreBreakdown.domainMatch)} />
                            <ScoreBar label="Hard Skills (20%)" value={result.resumeScoreBreakdown.hardSkills} colorClass={getBarColor(result.resumeScoreBreakdown.hardSkills)} />
                            <ScoreBar label="Soft Skills (10%)" value={result.resumeScoreBreakdown.softSkills} colorClass={getBarColor(result.resumeScoreBreakdown.softSkills)} />
                            <ScoreBar label="Experience Level (10%)" value={result.resumeScoreBreakdown.experience} colorClass={getBarColor(result.resumeScoreBreakdown.experience)} />
                        </div>
                    </div>

                    {/* SKILLS MATRIX */}
                    <div className="rounded-lg border border-border bg-card p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-emerald-500/10 rounded-md"><Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                            <h2 className="font-semibold text-foreground text-xl">Skill Match Matrix</h2>
                        </div>
                        
                        <div className="grid lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Matched</h4>
                                {groupedSkills.matched.map((s, i) => <SkillChip key={i} skill={s} />)}
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2"><XCircle className="w-4 h-4"/> Missing / Weak</h4>
                                {groupedSkills.missing.map((s, i) => <SkillChip key={i} skill={s} />)}
                                {groupedSkills.missing.length === 0 && <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">100% Matrix Coverage!</p>}
                            </div>
                        </div>
                    </div>

                    {/* ACTIONABLE INSIGHTS */}
                    <div className="rounded-lg border border-border bg-card p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-amber-500/10 rounded-md"><Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
                            <h2 className="font-semibold text-foreground text-xl">Actionable Insights</h2>
                        </div>
                        
                        <div className="space-y-3">
                            {visibleFeedback.map((fb, i) => <FeedbackItem key={i} feedback={fb} />)}
                        </div>
                        
                        {result.actionableFeedback.length > 5 && (
                            <button onClick={() => setShowAllFeedback(!showAllFeedback)} className="mt-6 w-full py-3 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors border border-border bg-muted">
                                {showAllFeedback ? "Collapse Details" : `Reveal ${result.actionableFeedback.length - 5} More Insights`}
                            </button>
                        )}
                    </div>

                    {/* MISSED OPPORTUNITIES */}
                    {result.missedOpportunities.length > 0 && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-8">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                <h2 className="font-semibold text-amber-600 dark:text-amber-400 text-xl">Missed Opportunities</h2>
                            </div>
                            <p className="text-sm text-amber-600/80 dark:text-amber-500/80 font-medium mb-6">These skills exist in your SkillSync profile but are missing from the uploaded resume.</p>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                {result.missedOpportunities.map((miss, idx) => (
                                    <div key={idx} className="bg-background p-4 rounded-md border border-amber-500/20 flex items-start gap-4">
                                        <ArrowRight className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-1 shrink-0" />
                                        <div>
                                            <div className="font-semibold text-foreground flex items-center justify-between">
                                                {miss.skill}
                                                <span className={`text-[9px] uppercase tracking-widest px-2 py-1 rounded bg-muted ${miss.impact === 'High' ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'}`}>{miss.impact} Impact</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{miss.reason}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}

function FeedbackItem({ feedback }: { feedback: ActionableFeedback }) {
    const isHigh = feedback.priority === "High";
    const isMed = feedback.priority === "Medium";
    
    return (
        <div className={`flex items-start gap-4 p-4 rounded-md border-l-4 ${isHigh ? 'border-l-rose-500 bg-rose-500/5 border-y border-r border-border' : isMed ? 'border-l-amber-500 bg-amber-500/5 border-y border-r border-border' : 'border-l-muted-foreground bg-muted/50 border-y border-r border-border'}`}>
            <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{feedback.message}</p>
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-widest shrink-0 ${isHigh ? 'text-rose-600 dark:text-rose-500' : isMed ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'}`}>
                {feedback.priority}
            </span>
        </div>
    );
}