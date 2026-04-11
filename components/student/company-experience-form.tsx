"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import MarkdownRenderer from "@/components/shared/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function CompanyExperienceForm() {
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [driveType, setDriveType] = useState("placement");
  const [outcome, setOutcome] = useState("not_disclosed");
  const [interviewProcess, setInterviewProcess] = useState("");
  const [tips, setTips] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [showName, setShowName] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    async function loadSuggestions() {
      if (companyName.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      const res = await fetch(`/api/student/experiences?mode=suggestions&q=${encodeURIComponent(companyName)}`);
      if (!res.ok) return;
      const json = await res.json();
      setSuggestions(json.suggestions ?? []);
    }

    loadSuggestions().catch(() => undefined);
  }, [companyName]);

  async function onSubmit() {
    if (!companyName.trim() || (!interviewProcess.trim() && !tips.trim())) {
      toast.error("Company name and at least one content field are required.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/student/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, roleTitle, driveType, outcome, interviewProcess, tips, difficulty, wouldRecommend, showName }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      toast.error(json.error ?? "Submission failed");
      return;
    }

    toast.success(json.message ?? "Experience submitted");
    setCompanyName("");
    setRoleTitle("");
    setInterviewProcess("");
    setTips("");
    setDifficulty(3);
    setWouldRecommend(true);
    setShowName(false);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-8 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Share Your Interview Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} list="company-suggestions" className="border-border bg-muted/20 text-foreground" />
            <datalist id="company-suggestions">
              {suggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
            </datalist>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Role Title</Label>
              <Input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} className="border-border bg-muted/20 text-foreground" />
            </div>
            <div className="space-y-2">
              <Label>Drive Type</Label>
              <select value={driveType} onChange={(event) => setDriveType(event.target.value)} className="h-10 w-full rounded-md border border-border bg-muted/20 px-3 text-sm text-foreground">
                <option value="placement">Placement</option>
                <option value="internship">Internship</option>
                <option value="ppo">PPO</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Outcome</Label>
            <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="h-10 w-full rounded-md border border-border bg-muted/20 px-3 text-sm text-foreground">
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
              <option value="not_disclosed">Prefer not to say</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Interview Process</Label>
            <Textarea rows={8} maxLength={1500} value={interviewProcess} onChange={(event) => setInterviewProcess(event.target.value)} className="border-border bg-muted/20 text-foreground" />
            <p className="text-xs text-muted-foreground">{interviewProcess.length}/1500</p>
          </div>
          <div className="space-y-2">
            <Label>Tips for Future Students</Label>
            <Textarea rows={6} maxLength={1000} value={tips} onChange={(event) => setTips(event.target.value)} className="border-border bg-muted/20 text-foreground" />
            <p className="text-xs text-muted-foreground">{tips.length}/1000</p>
          </div>
          <div className="space-y-2">
            <Label>Difficulty Rating</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setDifficulty(value)}>
                  <Star className={cn("h-6 w-6", value <= difficulty ? "fill-warning text-warning" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-4 py-3 text-sm text-foreground">
              <input type="checkbox" checked={wouldRecommend} onChange={(event) => setWouldRecommend(event.target.checked)} />
              I would recommend this company to juniors
            </label>
            <label className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-4 py-3 text-sm text-foreground">
              <input type="checkbox" checked={showName} onChange={(event) => setShowName(event.target.checked)} />
              Show my name publicly
            </label>
          </div>
          <Button onClick={onSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90">
            {submitting ? "Submitting..." : "Submit Experience"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Markdown Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {interviewProcess ? (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Interview Process</h4>
              <MarkdownRenderer content={interviewProcess} />
            </div>
          ) : null}
          {tips ? (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tips</h4>
              <MarkdownRenderer content={tips} />
            </div>
          ) : null}
          {!interviewProcess && !tips ? <p className="text-sm text-muted-foreground">Your markdown preview will appear here.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}