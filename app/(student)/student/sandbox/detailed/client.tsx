"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

// --- Custom Dark Theme Radar Chart ---
function RadarChart({ breakdown, label }: { breakdown: ScoreBreakdown; label: string }) {
    const dimensions = [
        { key: "hardSkills", label: "Hard Skills", value: breakdown.hardSkills },
        { key: "softSkills", label: "Soft Skills", value: breakdown.softSkills },
        { key: "experience", label: "Experience", value: breakdown.experience },
        { key: "domainMatch", label: "Domain", value: breakdown.domainMatch },
    ];

    const cx = 120, cy = 120, maxR = 90, n = dimensions.length;

    const gridCircles = [25, 50, 75, 100].map(pct => (
        <circle key={pct} cx={cx} cy={cy} r={maxR * pct / 100} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
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
                <line x1={cx} y1={cy} x2={endX} y2={endY} stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                    {d.label}
                </text>
            </g>
        );
    });

    return (
        <div className="flex flex-col items-center bg-muted/20 p-6 rounded-md border border-border">
            <span className="text-sm font-black text-foreground tracking-tight mb-4">{label} Breakdown</span>
            <svg viewBox="0 0 240 240" className="w-full max-w-[240px]">
                {gridCircles}
                {axes}
                <polygon points={polygon} fill="rgba(90, 119, 223, 0.2)" stroke="hsl(var(--primary))" strokeWidth="2" className="transition-all duration-1000" />
                {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" className="shadow-lg" />)}
            </svg>
        </div>
    );
}

function ScoreBar({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground">{value.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 bg-muted/20 rounded-full overflow-hidden border border-border">
                <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

function SkillChip({ skill }: { skill: CategorizedSkill }) {
    const config = {
        matched: { bg: "bg-success/10 border-success/20 text-success", icon: CheckCircle2 },
        missing: { bg: "bg-destructive/10 border-destructive/20 text-destructive", icon: XCircle },
        partial: { bg: "bg-warning/10 border-warning/20 text-warning", icon: AlertCircle },
    }[skill.status];

    const Icon = config.icon;
    const evidenceStars = "★".repeat(skill.evidenceLevel) + "☆".repeat(4 - skill.evidenceLevel);

    return (
        <div className={`flex items-center justify-between gap-4 px-4 py-3 rounded-md border ${config.bg} `}>
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0" />
                <div>
                    <div className="text-sm font-bold">{skill.skill}</div>
                    {skill.status === "matched" && (
                        <div className="text-[10px] font-medium opacity-80 mt-0.5 flex gap-1.5 items-center">
                            <span className="text-warning">{evidenceStars}</span> {skill.evidenceDetail}
                        </div>
                    )}
                </div>
            </div>
            <span className="text-[9px] uppercase tracking-widest font-black px-2 py-1 rounded bg-black/20 shrink-0">
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
        if (score >= 75) return "text-success";
        if (score >= 50) return "text-warning";
        return "text-destructive";
    }

    function getBarColor(score: number) {
        if (score >= 75) return "bg-success/10 shadow-sm";
        if (score >= 50) return "bg-warning/10 shadow-sm";
        return "bg-destructive/10 shadow-sm";
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

    const inputClass = "bg-muted/20 border-border text-foreground rounded-md focus:ring-primary";

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* INPUT GRID */}
            <div className="grid gap-6 lg:grid-cols-12 items-start">
                
                <div className="lg:col-span-5 space-y-6">
                    {/* Resume Upload */}
                    <div className="bg-card rounded-md border border-border p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-md"><FileText className="w-4 h-4 text-primary" /></div>
                            <h3 className="font-bold text-foreground">Target Resume</h3>
                        </div>
                        <label className="cursor-pointer block">
                            <div className={`border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center transition-all ${resumeFile ? "border-success/20 bg-success/10" : "border-border hover:border-primary/30 hover:bg-muted"}`}>
                                {resumeFile ? (
                                    <>
                                        <FileText className="h-8 w-8 text-success mb-3" />
                                        <span className="text-sm font-bold text-success truncate max-w-[200px]">{resumeFile.name}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Click to change</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                                        <span className="text-sm font-bold text-foreground mb-1">Upload PDF/DOCX</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Max 5MB</span>
                                    </>
                                )}
                                <Input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                            </div>
                        </label>
                    </div>

                    {/* JD Text */}
                    <div className="bg-card rounded-md border border-border p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-warning/10 rounded-md"><BookOpen className="w-4 h-4 text-warning" /></div>
                            <h3 className="font-bold text-foreground">Job Description</h3>
                        </div>
                        <Textarea placeholder="Paste full JD text here..." className={`${inputClass} min-h-[220px] p-5 text-sm resize-y`} value={jdText} onChange={(e) => setJdText(e.target.value)} />
                    </div>
                </div>

                {/* ACTION / HERO RAIL */}
                <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
                    {!result ? (
                        <div className="flex-1 bg-card border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center text-center p-10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-info/5 opacity-50" />
                            <div className="p-5 bg-card  rounded-full shadow-sm border border-border mb-6 z-10">
                                <div className="p-4 bg-card rounded-full">
                                    <Target className="w-8 h-8 text-primary/50" />
                                </div>
                            </div>
                            <h2 className="text-xl font-black text-foreground tracking-tight mb-2 z-10">Deep Analysis Engine</h2>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed z-10">Provide a resume and JD on the left to generate a multi-dimensional AI competency matrix.</p>
                        </div>
                    ) : (
                        <div className="bg-card  rounded-md border border-border p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                            
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-8 text-center">Engine Results</h3>
                            
                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                <div className="bg-muted/20 p-6 rounded-md border border-border text-center">
                                    <div className={`text-5xl font-black tracking-tighter ${getScoreColor(result.resumeMatchScore)}`}>{result.resumeMatchScore}%</div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 mb-3">Current Resume</div>
                                    <span className={`px-3 py-1 rounded border text-[10px] font-black uppercase tracking-wider ${result.resumeMatchScore >= 75 ? 'border-success/20 text-success bg-success/10' : 'border-warning/20 text-warning bg-warning/10'}`}>
                                        {result.recommendation?.replace("_", " ")}
                                    </span>
                                </div>
                                <div className="bg-muted/20 p-6 rounded-md border border-border text-center">
                                    <div className={`text-5xl font-black tracking-tighter ${getScoreColor(result.profileMatchScore)}`}>{result.profileMatchScore}%</div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 mb-3">True Potential</div>
                                    <span className="px-3 py-1 rounded border border-primary/30 text-primary bg-primary/10 text-[10px] font-black uppercase tracking-wider">
                                        Max Score
                                    </span>
                                </div>
                            </div>

                            {result.profileMatchScore > result.resumeMatchScore + 5 && (
                                <div className="mt-8 flex items-start gap-3 p-4 rounded-md bg-primary/10 border border-primary/30">
                                    <TrendingUp className="h-5 w-5 text-primary shrink-0" />
                                    <p className="text-sm font-medium text-primary">
                                        Your profile shows <strong className="text-foreground">{result.profileMatchScore - result.resumeMatchScore}% more potential</strong> than your resume currently reflects. Update your resume to close the gap!
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <button 
                        onClick={handleAnalyze} disabled={isLoading || !resumeFile || jdText.length < 50}
                        className="mt-6 w-full py-4 bg-primary hover:bg-primary disabled:bg-card text-foreground rounded-md font-bold transition-all shadow-sm disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing Vectors...</> : <><Zap className="w-5 h-5" /> Run Detailed Analysis</>}
                    </button>
                </div>
            </div>

            {/* RESULTS UI */}
            {result && (
                <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-20">

                    {/* RADAR CHARTS */}
                    <div className="bg-card rounded-md border border-border p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-info/10 rounded-md"><Shield className="w-5 h-5 text-info" /></div>
                            <h2 className="font-bold text-foreground text-xl">Dimensional Breakdown</h2>
                        </div>
                        
                        <div className="grid lg:grid-cols-2 gap-10">
                            <div className="flex justify-center"><RadarChart breakdown={result.resumeScoreBreakdown} label="Resume" /></div>
                            <div className="flex justify-center"><RadarChart breakdown={result.profileScoreBreakdown} label="Profile" /></div>
                        </div>

                        <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-6 pt-8 border-t border-border">
                            <ScoreBar label="Domain Match (60%)" value={result.resumeScoreBreakdown.domainMatch} colorClass={getBarColor(result.resumeScoreBreakdown.domainMatch)} />
                            <ScoreBar label="Hard Skills (20%)" value={result.resumeScoreBreakdown.hardSkills} colorClass={getBarColor(result.resumeScoreBreakdown.hardSkills)} />
                            <ScoreBar label="Soft Skills (10%)" value={result.resumeScoreBreakdown.softSkills} colorClass={getBarColor(result.resumeScoreBreakdown.softSkills)} />
                            <ScoreBar label="Experience Level (10%)" value={result.resumeScoreBreakdown.experience} colorClass={getBarColor(result.resumeScoreBreakdown.experience)} />
                        </div>
                    </div>

                    {/* SKILLS MATRIX */}
                    <div className="bg-card rounded-md border border-border p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-success/10 rounded-md"><Target className="w-5 h-5 text-success" /></div>
                            <h2 className="font-bold text-foreground text-xl">Skill Match Matrix</h2>
                        </div>
                        
                        <div className="grid lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-success mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Matched</h4>
                                {groupedSkills.matched.map((s, i) => <SkillChip key={i} skill={s} />)}
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-destructive mb-4 flex items-center gap-2"><XCircle className="w-4 h-4"/> Missing / Weak</h4>
                                {groupedSkills.missing.map((s, i) => <SkillChip key={i} skill={s} />)}
                                {groupedSkills.missing.length === 0 && <p className="text-sm font-bold text-success">100% Matrix Coverage!</p>}
                            </div>
                        </div>
                    </div>

                    {/* ACTIONABLE INSIGHTS */}
                    <div className="bg-card rounded-md border border-border p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-warning/10 rounded-md"><Lightbulb className="w-5 h-5 text-warning" /></div>
                            <h2 className="font-bold text-foreground text-xl">Actionable Insights</h2>
                        </div>
                        
                        <div className="space-y-3">
                            {visibleFeedback.map((fb, i) => <FeedbackItem key={i} feedback={fb} />)}
                        </div>
                        
                        {result.actionableFeedback.length > 5 && (
                            <button onClick={() => setShowAllFeedback(!showAllFeedback)} className="mt-6 w-full py-3 bg-muted/20 rounded-md text-xs font-bold text-muted-foreground hover:text-foreground transition-colors border border-border">
                                {showAllFeedback ? "Collapse Details" : `Reveal ${result.actionableFeedback.length - 5} More Insights`}
                            </button>
                        )}
                    </div>

                    {/* MISSED OPPORTUNITIES */}
                    {result.missedOpportunities.length > 0 && (
                        <div className="bg-gradient-to-r from-warning/10 to-primary/10 rounded-md border border-warning/20 p-8">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-6 h-6 text-warning" />
                                <h2 className="font-bold text-warning text-xl">Missed Opportunities</h2>
                            </div>
                            <p className="text-sm text-warning/80 font-medium mb-6">These skills exist in your SkillSync profile but are missing from the uploaded resume.</p>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                {result.missedOpportunities.map((miss, idx) => (
                                    <div key={idx} className="bg-muted/20 p-4 rounded-md border border-warning/20 flex items-start gap-4">
                                        <ArrowRight className="h-5 w-5 text-warning mt-1 shrink-0" />
                                        <div>
                                            <div className="font-bold text-foreground flex items-center justify-between">
                                                {miss.skill}
                                                <span className={`text-[9px] uppercase tracking-widest px-2 py-1 rounded bg-black/30 ${miss.impact === 'High' ? 'text-destructive' : 'text-muted-foreground'}`}>{miss.impact} Impact</span>
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
        <div className={`flex items-start gap-4 p-4 rounded-md border-l-4 ${isHigh ? 'border-l-destructive bg-destructive/10 border-y-border/40 border-r-border/40' : isMed ? 'border-l-warning bg-warning/10 border-y-border/40 border-r-border/40' : 'border-l-muted-foreground bg-muted/20 border-y-border/40 border-r-border/40'}`}>
            <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{feedback.message}</p>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${isHigh ? 'text-destructive' : isMed ? 'text-warning' : 'text-muted-foreground'}`}>
                {feedback.priority}
            </span>
        </div>
    );
}