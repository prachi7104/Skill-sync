// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Progress } from "@/components/ui/progress";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//     Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
// } from "@/components/ui/select";
// import { AlertTriangle, XCircle, Briefcase, FileText, CheckCircle2, Sparkles, Target, Activity } from "lucide-react";

// interface SandboxResult {
//     matchScore: number; semanticScore: number; structuredScore: number;
//     hardSkillsScore: number; softSkillsScore: number; experienceScore: number; domainMatchScore: number;
//     recommendation: string; matchedSkills: string[]; missingSkills: string[];
//     shortExplanation: string; detailedExplanation: string; isEligible: boolean; ineligibilityReason?: string;
//     redFlags?: Array<{ flag: string; severity: "Critical" | "Minor"; impact: number }>;
//     usage: { dailyUsed: number; dailyLimit: number; monthlyUsed: number; monthlyLimit: number; };
// }

// interface ErrorResponse { code?: string; reason?: string; nextStep?: string; message?: string; }
// interface DriveOption { id: string; company: string; roleTitle: string; rawJd: string; }

// export default function QuickSandbox() {
//     const [jdText, setJdText] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const [result, setResult] = useState<SandboxResult | null>(null);
//     const [error, setError] = useState<ErrorResponse | null>(null);

//     const [jdMode, setJdMode] = useState<"paste" | "drive">("paste");
//     const [drives, setDrives] = useState<DriveOption[]>([]);
//     const [drivesLoading, setDrivesLoading] = useState(false);
//     const [drivesLoaded, setDrivesLoaded] = useState(false);
//     const [selectedDriveId, setSelectedDriveId] = useState<string>("");

//     const fetchDrives = useCallback(async () => {
//         if (drivesLoaded) return;
//         setDrivesLoading(true);
//         try {
//             const res = await fetch("/api/drives");
//             const data = await res.json();
//             const list = (data.drives ?? []).map((d: DriveOption) => ({
//                 id: d.id, company: d.company, roleTitle: d.roleTitle, rawJd: d.rawJd,
//             }));
//             setDrives(list);
//             setDrivesLoaded(true);
//         } catch {
//             setDrives([]); setDrivesLoaded(true);
//         } finally { setDrivesLoading(false); }
//     }, [drivesLoaded]);

//     useEffect(() => {
//         if (jdMode === "drive" && !drivesLoaded) fetchDrives();
//     }, [jdMode, drivesLoaded, fetchDrives]);

//     function handleDriveSelect(driveId: string) {
//         setSelectedDriveId(driveId);
//         const drive = drives.find((d) => d.id === driveId);
//         if (drive) setJdText(drive.rawJd);
//     }

//     async function handleSubmit() {
//         if (jdText.trim().length < 20) return setError({ message: "Please enter at least 20 characters of JD text." });
//         setIsLoading(true); setError(null); setResult(null);

//         try {
//             const res = await fetch("/api/student/sandbox", {
//                 method: "POST", headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ jdText }),
//             });
//             const data = await res.json();
//             if (!res.ok) return setError(data);
//             setResult(data);
//         } catch { setError({ message: "Network error. Please try again." }); } 
//         finally { setIsLoading(false); }
//     }

//     function getScoreColor(score: number) {
//         if (score >= 75) return "text-emerald-400";
//         if (score >= 50) return "text-amber-400";
//         return "text-rose-400";
//     }

//     function getScoreBarColor(score: number) {
//         if (score >= 75) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
//         if (score >= 50) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
//         return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]";
//     }

//     function getRecommendationColor(rec: string) {
//         if (rec === "STRONG_MATCH" || rec === "STRONG_HIRE") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
//         if (rec === "INTERVIEW" || rec === "HIRE") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
//         if (rec === "CONSIDER" || rec === "HOLD") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
//         return "bg-rose-500/10 text-rose-400 border-rose-500/20";
//     }

//     const inputClass = "bg-slate-950/50 border-slate-800 text-white rounded-xl focus:ring-indigo-500";

//     return (
//         <div className="space-y-6">

//             {/* Input Section */}
//             <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-6 md:p-8">
//                 <div className="flex items-center gap-3 mb-6">
//                     <div className="p-2.5 bg-indigo-500/10 rounded-xl"><Target className="w-5 h-5 text-indigo-400" /></div>
//                     <div>
//                         <h2 className="font-bold text-white text-lg">Job Target</h2>
//                         <p className="text-sm text-slate-400">Paste a JD or pick from an active drive.</p>
//                     </div>
//                 </div>

//                 <Tabs value={jdMode} onValueChange={(v) => setJdMode(v as "paste" | "drive")} className="space-y-6">
//                     <TabsList className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 grid w-full md:w-[400px] grid-cols-2 h-auto">
//                         <TabsTrigger value="paste" className="py-2.5 rounded-lg text-sm font-bold data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-500 flex items-center gap-2">
//                             <FileText className="h-4 w-4" /> Paste JD
//                         </TabsTrigger>
//                         <TabsTrigger value="drive" className="py-2.5 rounded-lg text-sm font-bold data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-500 flex items-center gap-2">
//                             <Briefcase className="h-4 w-4" /> Active Drive
//                         </TabsTrigger>
//                     </TabsList>

//                     <TabsContent value="paste" className="space-y-3 mt-0">
//                         <Textarea
//                             value={jdText} onChange={(e) => setJdText(e.target.value)} rows={8}
//                             placeholder="Paste the job description here..."
//                             className={`${inputClass} min-h-[200px] p-5 text-sm resize-y`}
//                         />
//                         <div className="text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
//                             {jdText.length} characters
//                         </div>
//                     </TabsContent>

//                     <TabsContent value="drive" className="space-y-4 mt-0">
//                         {drivesLoading ? (
//                             <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-400 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
//                                 <Activity className="h-5 w-5 animate-pulse text-indigo-400" /> Fetching active drives...
//                             </div>
//                         ) : drives.length === 0 ? (
//                             <div className="py-12 text-center bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
//                                 <Briefcase className="h-8 w-8 mx-auto text-slate-600 mb-3" />
//                                 <p className="font-bold text-white mb-1">No active drives yet.</p>
//                                 <p className="text-sm text-slate-500">Use the "Paste JD" tab instead.</p>
//                             </div>
//                         ) : (
//                             <div className="space-y-4">
//                                 <Select value={selectedDriveId} onValueChange={handleDriveSelect}>
//                                     <SelectTrigger className={`${inputClass} py-6`}>
//                                         <SelectValue placeholder="Select a placement drive..." />
//                                     </SelectTrigger>
//                                     <SelectContent className="bg-slate-900 border-slate-800 text-white rounded-xl">
//                                         {drives.map((d) => (
//                                             <SelectItem key={d.id} value={d.id} className="py-3 cursor-pointer">
//                                                 <span className="font-bold text-indigo-400">{d.company}</span> <span className="text-slate-500 mx-2">—</span> {d.roleTitle}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                                 {selectedDriveId && (
//                                     <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
//                                         <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">JD Preview</p>
//                                         <p className="text-sm text-slate-300 line-clamp-4 leading-relaxed">{jdText}</p>
//                                     </div>
//                                 )}
//                             </div>
//                         )}
//                     </TabsContent>
//                 </Tabs>

//                 <div className="flex justify-end mt-6">
//                     <button 
//                         onClick={handleSubmit} 
//                         disabled={isLoading || jdText.trim().length < 20}
//                         className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
//                     >
//                         {isLoading ? <><Activity className="h-4 w-4 animate-spin" /> Analyzing...</> : "Run Quick Analysis"}
//                     </button>
//                 </div>
//             </div>

//             {error && (
//                 <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex gap-3">
//                     <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
//                     <div>
//                         <p className="text-sm font-bold text-rose-400">{error.reason || error.message || "An error occurred"}</p>
//                         {error.nextStep && <p className="text-xs text-rose-300 mt-1">{error.nextStep}</p>}
//                     </div>
//                 </div>
//             )}

//             {result && (
//                 <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    
//                     {/* Match Score Card */}
//                     <div className="bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 relative overflow-hidden">
//                         <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                        
//                         <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
//                             <div className="text-center md:border-r border-slate-800 md:pr-10">
//                                 <div className={`text-6xl font-black tracking-tighter ${getScoreColor(result.matchScore)}`}>
//                                     {result.matchScore.toFixed(1)}%
//                                 </div>
//                                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 mb-4">Overall Match</p>
//                                 {result.recommendation && (
//                                     <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getRecommendationColor(result.recommendation)}`}>
//                                         {result.recommendation.replace(/_/g, " ")}
//                                     </span>
//                                 )}
//                             </div>
                            
//                             <div className="flex-1 space-y-5 w-full">
//                                 <ScoreRow label="Domain Knowledge" pct={result.domainMatchScore ?? result.semanticScore} colorClass={getScoreBarColor(result.domainMatchScore ?? result.semanticScore)} />
//                                 <ScoreRow label="Hard Skills" pct={result.hardSkillsScore ?? result.structuredScore} colorClass={getScoreBarColor(result.hardSkillsScore ?? result.structuredScore)} />
//                                 <ScoreRow label="Soft Skills" pct={result.softSkillsScore ?? 0} colorClass={getScoreBarColor(result.softSkillsScore ?? 0)} />
//                                 <ScoreRow label="Experience Req" pct={result.experienceScore ?? 0} colorClass={getScoreBarColor(result.experienceScore ?? 0)} />
//                             </div>
//                         </div>

//                         {!result.isEligible && (
//                             <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400 font-medium flex gap-3">
//                                 <AlertTriangle className="h-5 w-5 shrink-0" />
//                                 <div><strong className="text-amber-300">Not Eligible:</strong> {result.ineligibilityReason}</div>
//                             </div>
//                         )}

//                         {result.redFlags && result.redFlags.length > 0 && (
//                             <div className="mt-6 space-y-3 pt-6 border-t border-slate-800">
//                                 <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
//                                     <AlertTriangle className="h-4 w-4" /> Detected Flags
//                                 </h4>
//                                 {result.redFlags.map((rf, i) => (
//                                     <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border text-sm font-medium ${rf.severity === "Critical" ? "bg-rose-500/10 border-rose-500/20 text-rose-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300"}`}>
//                                         <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
//                                         <span><strong className="text-white mr-2">{rf.severity}</strong> {rf.flag} (-{rf.impact} pts)</span>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </div>

//                     {/* Skill Analysis */}
//                     <div className="grid md:grid-cols-2 gap-6">
//                         <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-7">
//                             <h4 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
//                                 <CheckCircle2 className="h-5 w-5" /> Matched Skills ({result.matchedSkills.length})
//                             </h4>
//                             <div className="flex flex-wrap gap-2">
//                                 {result.matchedSkills.length > 0 ? result.matchedSkills.map(s => (
//                                     <span key={s} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg">{s}</span>
//                                 )) : <span className="text-xs text-slate-500 italic">No skills matched</span>}
//                             </div>
//                         </div>
//                         <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-7">
//                             <h4 className="text-sm font-bold text-rose-400 mb-4 flex items-center gap-2">
//                                 <XCircle className="h-5 w-5" /> Missing Skills ({result.missingSkills.length})
//                             </h4>
//                             <div className="flex flex-wrap gap-2">
//                                 {result.missingSkills.length > 0 ? result.missingSkills.map(s => (
//                                     <span key={s} className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-lg">{s}</span>
//                                 )) : <span className="text-xs text-emerald-500 italic font-bold">100% skill coverage!</span>}
//                             </div>
//                         </div>
//                     </div>

//                     {/* AI Explanation */}
//                     <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-8">
//                         <div className="flex items-center gap-3 mb-6">
//                             <div className="p-2.5 bg-indigo-500/10 rounded-xl"><Sparkles className="w-5 h-5 text-indigo-400" /></div>
//                             <h2 className="font-bold text-white text-lg">AI Analysis</h2>
//                         </div>
//                         <p className="text-sm font-bold text-slate-300 mb-4">{result.shortExplanation}</p>
//                         <pre className="whitespace-pre-wrap text-sm text-slate-400 bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono leading-relaxed">
//                             {result.detailedExplanation}
//                         </pre>
//                     </div>

//                 </div>
//             )}
//         </div>
//     );
// }

// function ScoreRow({ label, pct, colorClass }: { label: string, pct: number, colorClass: string }) {
//     return (
//         <div>
//             <div className="flex justify-between text-xs mb-1.5 font-bold">
//                 <span className="text-slate-400 uppercase tracking-wider">{label}</span>
//                 <span className="text-white">{pct.toFixed(1)}%</span>
//             </div>
//             <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
//                 <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
//             </div>
//         </div>
//     )
// }






"use client";

import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, XCircle, Briefcase, FileText, CheckCircle2, Sparkles, Target, Activity } from "lucide-react";

interface SandboxResult {
    matchScore: number; semanticScore: number; structuredScore: number;
    hardSkillsScore: number; softSkillsScore: number; experienceScore: number; domainMatchScore: number;
    recommendation: string; matchedSkills: string[]; missingSkills: string[];
    shortExplanation: string; detailedExplanation: string; isEligible: boolean; ineligibilityReason?: string;
    redFlags?: Array<{ flag: string; severity: "Critical" | "Minor"; impact: number }>;
    usage: { dailyUsed: number; dailyLimit: number; monthlyUsed: number; monthlyLimit: number; };
}

interface ErrorResponse { code?: string; reason?: string; nextStep?: string; message?: string; }
interface DriveOption { id: string; company: string; roleTitle: string; rawJd: string; }

export default function QuickSandbox() {
    const [jdText, setJdText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SandboxResult | null>(null);
    const [error, setError] = useState<ErrorResponse | null>(null);

    const [jdMode, setJdMode] = useState<"paste" | "drive">("paste");
    const [drives, setDrives] = useState<DriveOption[]>([]);
    const [drivesLoading, setDrivesLoading] = useState(false);
    const [drivesLoaded, setDrivesLoaded] = useState(false);
    const [selectedDriveId, setSelectedDriveId] = useState<string>("");

    const fetchDrives = useCallback(async () => {
        if (drivesLoaded) return;
        setDrivesLoading(true);
        try {
            const res = await fetch("/api/drives");
            const data = await res.json();
            const list = (data.drives ?? []).map((d: DriveOption) => ({
                id: d.id, company: d.company, roleTitle: d.roleTitle, rawJd: d.rawJd,
            }));
            setDrives(list);
            setDrivesLoaded(true);
        } catch {
            setDrives([]); setDrivesLoaded(true);
        } finally { setDrivesLoading(false); }
    }, [drivesLoaded]);

    useEffect(() => {
        if (jdMode === "drive" && !drivesLoaded) fetchDrives();
    }, [jdMode, drivesLoaded, fetchDrives]);

    function handleDriveSelect(driveId: string) {
        setSelectedDriveId(driveId);
        const drive = drives.find((d) => d.id === driveId);
        if (drive) setJdText(drive.rawJd);
    }

    async function handleSubmit() {
        if (jdText.trim().length < 20) return setError({ message: "Please enter at least 20 characters of JD text." });
        setIsLoading(true); setError(null); setResult(null);

        try {
            const res = await fetch("/api/student/sandbox", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jdText }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data);
            setResult(data);
        } catch { setError({ message: "Network error. Please try again." }); } 
        finally { setIsLoading(false); }
    }

    function getScoreColor(score: number) {
        if (score >= 75) return "text-emerald-400";
        if (score >= 50) return "text-amber-400";
        return "text-rose-400";
    }

    function getScoreBarColor(score: number) {
        if (score >= 75) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
        if (score >= 50) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
        return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]";
    }

    function getRecommendationColor(rec: string) {
        if (rec === "STRONG_MATCH" || rec === "STRONG_HIRE") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        if (rec === "INTERVIEW" || rec === "HIRE") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
        if (rec === "CONSIDER" || rec === "HOLD") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }

    const inputClass = "bg-slate-950/50 border-slate-800 text-white rounded-xl focus:ring-indigo-500";

    return (
        <div className="space-y-6">

            <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl"><Target className="w-5 h-5 text-indigo-400" /></div>
                    <div>
                        <h2 className="font-bold text-white text-lg">Job Target</h2>
                        <p className="text-sm text-slate-400">Paste a JD or pick from an active drive.</p>
                    </div>
                </div>

                <Tabs value={jdMode} onValueChange={(v) => setJdMode(v as "paste" | "drive")} className="space-y-6">
                    <TabsList className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 grid w-full md:w-[400px] grid-cols-2 h-auto">
                        <TabsTrigger value="paste" className="py-2.5 rounded-lg text-sm font-bold data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-500 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Paste JD
                        </TabsTrigger>
                        <TabsTrigger value="drive" className="py-2.5 rounded-lg text-sm font-bold data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-500 flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> Active Drive
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="paste" className="space-y-3 mt-0">
                        <Textarea
                            value={jdText} onChange={(e) => setJdText(e.target.value)} rows={8}
                            placeholder="Paste the job description here..."
                            className={`${inputClass} min-h-[200px] p-5 text-sm resize-y`}
                        />
                        <div className="text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {jdText.length} characters
                        </div>
                    </TabsContent>

                    <TabsContent value="drive" className="space-y-4 mt-0">
                        {drivesLoading ? (
                            <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-400 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                                <Activity className="h-5 w-5 animate-pulse text-indigo-400" /> Fetching active drives...
                            </div>
                        ) : drives.length === 0 ? (
                            <div className="py-12 text-center bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                                <Briefcase className="h-8 w-8 mx-auto text-slate-600 mb-3" />
                                <p className="font-bold text-white mb-1">No active drives yet.</p>
                                <p className="text-sm text-slate-500">Use the &quot;Paste JD&quot; tab instead.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Select value={selectedDriveId} onValueChange={handleDriveSelect}>
                                    <SelectTrigger className={`${inputClass} py-6`}>
                                        <SelectValue placeholder="Select a placement drive..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white rounded-xl">
                                        {drives.map((d) => (
                                            <SelectItem key={d.id} value={d.id} className="py-3 cursor-pointer">
                                                <span className="font-bold text-indigo-400">{d.company}</span> <span className="text-slate-500 mx-2">—</span> {d.roleTitle}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedDriveId && (
                                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">JD Preview</p>
                                        <p className="text-sm text-slate-300 line-clamp-4 leading-relaxed">{jdText}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end mt-6">
                    <button 
                        onClick={handleSubmit} 
                        disabled={isLoading || jdText.trim().length < 20}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? <><Activity className="h-4 w-4 animate-spin" /> Analyzing...</> : "Run Quick Analysis"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-rose-400">{error.reason || error.message || "An error occurred"}</p>
                        {error.nextStep && <p className="text-xs text-rose-300 mt-1">{error.nextStep}</p>}
                    </div>
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 relative overflow-hidden">
                        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                            <div className="text-center md:border-r border-slate-800 md:pr-10">
                                <div className={`text-6xl font-black tracking-tighter ${getScoreColor(result.matchScore)}`}>
                                    {result.matchScore.toFixed(1)}%
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 mb-4">Overall Match</p>
                                {result.recommendation && (
                                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getRecommendationColor(result.recommendation)}`}>
                                        {result.recommendation.replace(/_/g, " ")}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex-1 space-y-5 w-full">
                                <ScoreRow label="Domain Knowledge" pct={result.domainMatchScore ?? result.semanticScore} colorClass={getScoreBarColor(result.domainMatchScore ?? result.semanticScore)} />
                                <ScoreRow label="Hard Skills" pct={result.hardSkillsScore ?? result.structuredScore} colorClass={getScoreBarColor(result.hardSkillsScore ?? result.structuredScore)} />
                                <ScoreRow label="Soft Skills" pct={result.softSkillsScore ?? 0} colorClass={getScoreBarColor(result.softSkillsScore ?? 0)} />
                                <ScoreRow label="Experience Req" pct={result.experienceScore ?? 0} colorClass={getScoreBarColor(result.experienceScore ?? 0)} />
                            </div>
                        </div>

                        {!result.isEligible && (
                            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400 font-medium flex gap-3">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <div><strong className="text-amber-300">Not Eligible:</strong> {result.ineligibilityReason}</div>
                            </div>
                        )}

                        {result.redFlags && result.redFlags.length > 0 && (
                            <div className="mt-6 space-y-3 pt-6 border-t border-slate-800">
                                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> Detected Flags
                                </h4>
                                {result.redFlags.map((rf, i) => (
                                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border text-sm font-medium ${rf.severity === "Critical" ? "bg-rose-500/10 border-rose-500/20 text-rose-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300"}`}>
                                        <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span><strong className="text-white mr-2">{rf.severity}</strong> {rf.flag} (-{rf.impact} pts)</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-7">
                            <h4 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" /> Matched Skills ({result.matchedSkills.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {result.matchedSkills.length > 0 ? result.matchedSkills.map(s => (
                                    <span key={s} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg">{s}</span>
                                )) : <span className="text-xs text-slate-500 italic">No skills matched</span>}
                            </div>
                        </div>
                        <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-7">
                            <h4 className="text-sm font-bold text-rose-400 mb-4 flex items-center gap-2">
                                <XCircle className="h-5 w-5" /> Missing Skills ({result.missingSkills.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {result.missingSkills.length > 0 ? result.missingSkills.map(s => (
                                    <span key={s} className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-lg">{s}</span>
                                )) : <span className="text-xs text-emerald-500 italic font-bold">100% skill coverage!</span>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl"><Sparkles className="w-5 h-5 text-indigo-400" /></div>
                            <h2 className="font-bold text-white text-lg">AI Analysis</h2>
                        </div>
                        <p className="text-sm font-bold text-slate-300 mb-4">{result.shortExplanation}</p>
                        <pre className="whitespace-pre-wrap text-sm text-slate-400 bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono leading-relaxed">
                            {result.detailedExplanation}
                        </pre>
                    </div>

                </div>
            )}
        </div>
    );
}

function ScoreRow({ label, pct, colorClass }: { label: string, pct: number, colorClass: string }) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1.5 font-bold">
                <span className="text-slate-400 uppercase tracking-wider">{label}</span>
                <span className="text-white">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
        </div>
    )
}