"use client";

import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, XCircle, Briefcase, FileText, Sparkles, Target, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

interface CardFeedback {
  cards: {
    technicalSkills: { score: number; bullets: string[] };
    experienceDepth: { score: number; bullets: string[] };
    domainAlignment: { score: number; bullets: string[]; multiDomainNote: string | null };
    resumeQuality: { score: number; bullets: string[] };
  };
  feedback: Array<{
    priority: "Critical" | "Medium" | "Low";
    type: "add_to_resume" | "learn_skill" | "quantify" | "highlight" | "format";
    title: string;
    body: string;
    evidence: string;
  }>;
  softSkillSignals: string[];
}

interface SandboxResult {
    matchScore: number; semanticScore: number; structuredScore: number;
    hardSkillsScore: number; softSkillsScore: number; experienceScore: number; domainMatchScore: number;
    recommendation: string; matchedSkills: string[]; missingSkills: string[];
    shortExplanation: string; detailedExplanation: string; isEligible: boolean; ineligibilityReason?: string;
    seniorityWarning?: string | null;
    feedbackVersion?: "v2_cards" | "v1_text";
    cardFeedback?: CardFeedback | null;
    redFlags?: Array<{ flag: string; severity: "Critical" | "Minor"; impact: number }>;
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
            setDrives([]);
            setDrivesLoaded(true);
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
        if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
        if (score >= 60) return "text-amber-600 dark:text-amber-400";
        return "text-destructive";
    }

    return (
        <div className="space-y-6">
            <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <Target className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <h2 className="font-semibold text-foreground text-base">Job Target</h2>
                        <p className="text-sm text-muted-foreground">Paste a JD or pick from an active drive.</p>
                    </div>
                </div>

                <Tabs value={jdMode} onValueChange={(v) => setJdMode(v as "paste" | "drive")} className="space-y-6">
                    <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                        <TabsTrigger value="paste" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Paste JD
                        </TabsTrigger>
                        <TabsTrigger value="drive" className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> Active Drive
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="paste" className="space-y-3 mt-0">
                        <Textarea
                            value={jdText} onChange={(e) => setJdText(e.target.value)} rows={8}
                            placeholder="Paste the job description here..."
                            className="bg-transparent border-border min-h-[200px] text-sm resize-y"
                        />
                        <div className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                            {jdText.length} characters
                        </div>
                    </TabsContent>

                    <TabsContent value="drive" className="space-y-4 mt-0">
                        {drivesLoading ? (
                            <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground bg-muted/50 rounded-md border border-dashed border-border">
                                <Activity className="h-5 w-5 animate-pulse" /> Fetching active drives...
                            </div>
                        ) : drives.length === 0 ? (
                            <div className="py-12 text-center bg-muted/50 rounded-md border border-dashed border-border">
                                <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                                <p className="font-semibold text-foreground mb-1">No active drives yet.</p>
                                <p className="text-sm text-muted-foreground">Use the "Paste JD" tab instead.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Select value={selectedDriveId} onValueChange={handleDriveSelect}>
                                    <SelectTrigger className="py-6 border-border">
                                        <SelectValue placeholder="Select a placement drive..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {drives.map((d) => (
                                            <SelectItem key={d.id} value={d.id} className="py-3 cursor-pointer">
                                                <span className="font-semibold text-primary">{d.company}</span> <span className="text-muted-foreground mx-2">—</span> {d.roleTitle}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedDriveId && (
                                    <div className="bg-muted/30 p-5 rounded-md border border-border">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">JD Preview</p>
                                        <p className="text-sm text-foreground line-clamp-4 leading-relaxed">{jdText}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end mt-6">
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isLoading || jdText.trim().length < 20}
                        className="px-8 py-5"
                    >
                        {isLoading ? <><Activity className="h-4 w-4 animate-spin mr-2" /> Analyzing...</> : "Run Quick Analysis"}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mx-6 md:mx-8 mb-6 bg-destructive/10 border border-destructive/20 p-5 rounded-md flex gap-3 text-destructive">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold">{error.reason || error.message || "An error occurred"}</p>
                        {error.nextStep && <p className="text-xs mt-1 opacity-90">{error.nextStep}</p>}
                    </div>
                </div>
            )}

            {result && (
                <div className="px-6 md:px-8 pb-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  {result.feedbackVersion === "v2_cards" && result.cardFeedback ? (
                    <ResultSectionV2 result={result} />
                  ) : (
                    <ResultSectionV1 result={result} getScoreColor={getScoreColor} />
                  )}
                </div>
            )}
        </div>
    );
}

function ResultSectionV2({ result }: { result: SandboxResult }) {
  const cardFeedback = result.cardFeedback!;
  
  return (
    <>
      <div className="bg-card rounded-md border border-border p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="text-center md:border-r border-border md:pr-10">
            <div className={`text-5xl font-black tracking-tighter ${result.matchScore >= 80 ? "text-emerald-600 dark:text-emerald-400" : result.matchScore >= 60 ? "text-amber-600 dark:text-amber-400" : "text-destructive"}`}>
              {result.matchScore.toFixed(1)}%
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-2 mb-4">Overall Match</p>
            {result.recommendation && (
              <Badge variant={result.recommendation.includes("MATCH") ? "default" : "destructive"} className="uppercase tracking-widest text-[10px]">
                {result.recommendation}
              </Badge>
            )}
          </div>
          
          <div className="flex-1 w-full">
            <p className="text-sm font-semibold text-foreground mb-6">{result.shortExplanation}</p>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="improve" className="text-xs">Improve Resume</TabsTrigger>
                <TabsTrigger value="keywords" className="text-xs">Keywords</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DimensionCard title="Technical Skills" score={result.hardSkillsScore} bullets={cardFeedback.cards.technicalSkills.bullets} />
                  <DimensionCard title="Experience Depth" score={result.experienceScore} bullets={cardFeedback.cards.experienceDepth.bullets} />
                  <DimensionCard title="Domain Alignment" score={result.domainMatchScore} bullets={cardFeedback.cards.domainAlignment.bullets} note={cardFeedback.cards.domainAlignment.multiDomainNote} />
                  <DimensionCard title="Resume Quality" score={cardFeedback.cards.resumeQuality.score} bullets={cardFeedback.cards.resumeQuality.bullets} />
                </div>

                <div className="border border-border rounded-md p-5 bg-card">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Seniority Fit</p>
                  {result.seniorityWarning ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">{result.seniorityWarning}</p>
                  ) : (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4">Role level matches your profile</p>
                  )}
                  <div className="space-y-3">
                    <ScoreRow label="Hard Skills" pct={result.hardSkillsScore} />
                    <ScoreRow label="Experience" pct={result.experienceScore} />
                    <ScoreRow label="Domain" pct={result.domainMatchScore} />
                    <ScoreRow label="Seniority" pct={result.experienceScore} />
                  </div>
                </div>

                <div className="border border-border rounded-md p-5 bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Soft Skills</p>
                    <Badge variant="secondary" className="text-[10px]">not scored</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Soft skills detected from resume evidence.</p>
                  <div className="flex flex-wrap gap-2">
                    {cardFeedback.softSkillSignals.length > 0 ? (
                      cardFeedback.softSkillSignals.map((signal, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-medium border-border">
                          {signal.split(":")[0]}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No soft skill signals detected</span>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="improve" className="space-y-6 mt-0">
                {["Critical", "Medium", "Low"].map((priority) => {
                  const items = cardFeedback.feedback.filter(f => f.priority === priority);
                  if (items.length === 0) return null;
                  return (
                    <div key={priority}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {priority === "Critical" ? "HIGH PRIORITY" : priority === "Medium" ? "MEDIUM PRIORITY" : "LOW PRIORITY"}
                      </p>
                      <div className="space-y-3">
                        {items.map((item, i) => <FeedbackCard key={i} item={item} />)}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="keywords" className="space-y-6 mt-0">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border border-border rounded-md p-5 bg-card">
                    <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-4">Missing from Resume</p>
                    <div className="flex flex-wrap gap-2">
                      {result.missingSkills.length > 0 ? (
                        result.missingSkills.map(skill => (
                          <Badge key={skill} variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/10 border-none text-[11px] py-0.5">{skill}</Badge>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 italic font-semibold">100% skill coverage!</span>
                      )}
                    </div>
                  </div>

                  <div className="border border-border rounded-md p-5 bg-card">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4">Already Present</p>
                    <div className="flex flex-wrap gap-2">
                      {result.matchedSkills.length > 0 ? (
                        result.matchedSkills.map(skill => (
                          <Badge key={skill} variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-none text-[11px] py-0.5">{skill}</Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No matched skills</span>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {!result.isEligible && (
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm text-amber-600 dark:text-amber-400 font-medium flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div><strong className="font-semibold">Not Eligible:</strong> {result.ineligibilityReason}</div>
          </div>
        )}

        {result.redFlags && result.redFlags.length > 0 && (
          <div className="mt-6 space-y-3 pt-6 border-t border-border">
            <h4 className="text-xs font-semibold text-destructive uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Detected Flags
            </h4>
            {result.redFlags.map((rf, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-md border text-sm font-medium ${rf.severity === "Critical" ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"}`}>
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span><strong className="mr-2">{rf.severity}</strong> {rf.flag} (-{rf.impact} pts)</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function DimensionCard({ title, score, bullets, note }: { title: string; score: number; bullets: string[]; note?: string | null }) {
  const isGood = score >= 80;
  const isOk = score >= 60;
  return (
    <div className="border border-border bg-muted/30 rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className={`text-base font-bold ${isGood ? "text-emerald-600 dark:text-emerald-400" : isOk ? "text-amber-600 dark:text-amber-400" : "text-destructive"}`}>
          {score.toFixed(0)}%
        </span>
      </div>
      <div className="space-y-1.5">
        {bullets.map((bullet, i) => (
          <p key={i} className="text-xs text-muted-foreground leading-relaxed">• {bullet}</p>
        ))}
      </div>
      {note && <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border italic">{note}</p>}
    </div>
  );
}

function FeedbackCard({ item }: { item: CardFeedback["feedback"][0] }) {
  return (
    <div className="border border-border bg-muted/30 rounded-md p-4">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h5 className="text-sm font-semibold text-foreground flex-1">{item.title}</h5>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-border whitespace-nowrap">
          {item.type.replace(/_/g, " ")}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{item.body}</p>
      <p className="text-[10px] text-muted-foreground/70 italic">— {item.evidence}</p>
    </div>
  );
}

function ScoreRow({ label, pct }: { label: string; pct: number }) {
  const isGood = pct >= 80;
  const isOk = pct >= 60;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 font-semibold">
        <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-foreground">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isGood ? "bg-emerald-500" : isOk ? "bg-amber-500" : "bg-destructive"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ResultSectionV1({ result, getScoreColor }: { result: SandboxResult; getScoreColor: (score: number) => string; }) {
  return (
    <div className="bg-card rounded-md border border-border p-6 md:p-8">
      <p className="text-xs text-muted-foreground mb-6 font-semibold">Showing simplified analysis</p>
      <div className="flex flex-col md:flex-row items-center gap-10">
        <div className="text-center md:border-r border-border md:pr-10">
          <div className={`text-5xl font-black tracking-tighter ${getScoreColor(result.matchScore)}`}>
            {result.matchScore.toFixed(1)}%
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-2 mb-4">Overall Match</p>
        </div>
        <div className="flex-1 space-y-4 w-full">
          <ScoreRow label="Domain Knowledge" pct={result.domainMatchScore ?? result.semanticScore} />
          <ScoreRow label="Hard Skills" pct={result.hardSkillsScore ?? result.structuredScore} />
          <ScoreRow label="Soft Skills" pct={result.softSkillsScore ?? 0} />
          <ScoreRow label="Experience Req" pct={result.experienceScore ?? 0} />
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> AI Explanation
        </h4>
        <p className="text-sm text-foreground mb-4 font-medium">{result.shortExplanation}</p>
        <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-muted/50 border border-border rounded-md p-4 font-mono leading-relaxed">
          {result.detailedExplanation}
        </pre>
      </div>
    </div>
  );
}