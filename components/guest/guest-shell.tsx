"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, CircleHelp, Clock, Loader2, LogOut } from "lucide-react";
import { getSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Kind = "student" | "recruiter";

const INTRO: Record<Kind, { title: string; steps: Array<{ title: string; body: string }> }> = {
  student: {
    title: "Welcome to the student demo",
    steps: [
      { title: "Start with the sample profile", body: "Jordan Lee is a fictional student whose profile is already loaded, so every view has data straight away." },
      { title: "Analyse a resume", body: "Use “Try Sample Resume” to run the real AI parser on a sample resume, or upload your own PDF or DOCX. Your profile, scores and rankings update from the result." },
      { title: "See where you stand", body: "Job fit shows your computed match score for each fictional opening, the skills you match and miss, and how you rank against fictional candidates." },
      { title: "Get advice", body: "AI recommendations and the career coach use your profile and scores. Everything AI-generated is labelled with the model that produced it." },
    ],
  },
  recruiter: {
    title: "Welcome to the recruiter demo",
    steps: [
      { title: "Pick an opening", body: "Four fictional openings are ready, each with a pool of twelve fictional candidates already ranked." },
      { title: "Read the ranking", body: "Each match score combines semantic similarity of profile and job description with structured skill and eligibility checks." },
      { title: "Dig into a candidate", body: "Open a candidate to see their profile, matched and missing skills, and request an AI explanation grounded in the computed scores." },
      { title: "Shortlist and edit", body: "Filter, search and shortlist candidates — the shortlist is saved. Edit an opening's skills and the pool is re-ranked." },
    ],
  },
};

export function GuestShell({ kind, expiresAt, showIntro, children }: { kind: Kind; expiresAt: number; showIntro: boolean; children: React.ReactNode }) {
  const other: Kind = kind === "student" ? "recruiter" : "student";
  const [introOpen, setIntroOpen] = useState(showIntro);
  const [step, setStep] = useState(0);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const [expired, setExpired] = useState(false);
  const hoursLeft = Math.max(0, Math.round((expiresAt - Date.now()) / 3_600_000));

  useEffect(() => {
    if (showIntro) window.history.replaceState(null, "", `/guest/${kind}`);
    const onExpired = () => setExpired(true);
    window.addEventListener("guest-session-expired", onExpired);
    return () => window.removeEventListener("guest-session-expired", onExpired);
  }, [kind, showIntro]);

  async function exitDemo() {
    // End the workspace on the server first so a copied cookie cannot be replayed,
    // then clear the local session. Sign-out still happens if the request fails.
    await fetch("/api/demo/exit", { method: "POST", cache: "no-store" }).catch(() => null);
    await signOut({ callbackUrl: "/" });
  }

  async function switchRole() {
    setSwitching(true);
    setSwitchError("");
    const result = await signIn("guest", { kind: other, switch: "true", redirect: false, callbackUrl: `/guest/${other}` }).catch(() => null);
    const session = result?.ok && !result.error ? await getSession() : null;
    if (session?.user?.role === (other === "recruiter" ? "faculty" : "student")) {
      window.location.assign(`/guest/${other}`);
    } else {
      setSwitchError("Couldn't switch roles. Your workspace may have ended.");
      setSwitching(false);
    }
  }

  const intro = INTRO[kind];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/guest" className="text-lg font-black tracking-tight">Skill<span className="text-primary">Sync</span></Link>
          <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            Guest · {kind}
          </span>
          <span className="hidden items-center gap-1 text-xs text-muted-foreground md:inline-flex">
            <Clock className="size-3.5" aria-hidden="true" /> Workspace deleted in ~{hoursLeft}h
          </span>
          <nav aria-label="Guest actions" className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" aria-label="Show the tour" onClick={() => { setStep(0); setIntroOpen(true); }}>
              <CircleHelp aria-hidden="true" /> <span className="hidden sm:inline">Tour</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void switchRole()} disabled={switching}>
              {switching ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ArrowLeftRight aria-hidden="true" />}
              <span>View as {other}</span>
            </Button>
            <Button variant="ghost" size="sm" aria-label="Exit demo" onClick={() => void exitDemo()}>
              <LogOut aria-hidden="true" /> <span className="hidden sm:inline">Exit demo</span>
            </Button>
          </nav>
        </div>
        {switchError && <p role="alert" className="mx-auto max-w-7xl px-4 pb-2 text-xs text-destructive sm:px-6">{switchError}</p>}
      </header>

      <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <Dialog open={introOpen} onOpenChange={setIntroOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{intro.title}</DialogTitle>
            <DialogDescription>Step {step + 1} of {intro.steps.length}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2" aria-live="polite">
            <p className="font-semibold">{intro.steps[step].title}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{intro.steps[step].body}</p>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {intro.steps.map((s, i) => <span key={s.title} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />)}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIntroOpen(false)}>Skip tour</Button>
            {step < intro.steps.length - 1
              ? <Button onClick={() => setStep(step + 1)}>Next</Button>
              : <Button onClick={() => setIntroOpen(false)}>Start exploring</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={expired} onOpenChange={() => undefined}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your guest session has ended</DialogTitle>
            <DialogDescription>Guest workspaces expire after 24 hours and their data is deleted. Start a new one to keep exploring.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => void signOut({ callbackUrl: "/guest" })}>Start a new demo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
