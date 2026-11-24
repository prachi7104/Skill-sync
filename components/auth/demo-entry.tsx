"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const guestOptions = [
  {
    kind: "student", role: "student", title: "Explore as Student", icon: GraduationCap,
    description: "See how SkillSync reads a resume and matches it to openings.",
    features: ["Pre-filled sample profile, ready immediately", "Analyse the sample resume or upload your own PDF/DOCX", "Job-fit scores, skill gaps and AI improvement tips", "Compare with fictional candidates and chat with a career coach"],
  },
  {
    kind: "recruiter", role: "faculty", title: "Explore as Recruiter", icon: BriefcaseBusiness,
    description: "Rank a pool of fictional candidates against sample openings.",
    features: ["Four sample openings you can edit", "Ranked candidates with match scores and skill analysis", "AI explanations grounded in the computed scores", "Filter, search and build a shortlist that persists"],
  },
] as const;

type GuestOption = typeof guestOptions[number];

export function DemoGuestSelection({ workspaceError = false, current }: { workspaceError?: boolean; current?: "student" | "recruiter" | null }) {
  const [pending, setPending] = useState<GuestOption["kind"]>();
  const [error, setError] = useState(workspaceError ? "Your previous guest workspace has ended. Choose a role to start a fresh one." : "");

  async function start(option: GuestOption) {
    setPending(option.kind);
    setError("");
    try {
      // Explicit callbackUrl: by default next-auth uses the current URL and reports any
      // `error` query param on it as a sign-in error.
      const result = await signIn("guest", { kind: option.kind, redirect: false, callbackUrl: `/guest/${option.kind}` });
      if (!result?.ok || result.error) throw new Error("Guest sign-in failed");
      const session = await getSession();
      if (session?.user?.role !== option.role) throw new Error("Guest session could not be verified");
      window.location.assign(`/guest/${option.kind}?intro=1`);
    } catch {
      setError("We couldn't create a guest workspace right now. Please try again in a moment.");
      setPending(undefined);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-8 sm:py-14">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/"><ArrowLeft aria-hidden="true" /> Back to sign in</Link>
      </Button>
      <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">Live demo · no account needed</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">How would you like to explore SkillSync?</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Each visit gets its own private workspace. Companies, openings and candidates in the demo are fictional.
        Scores are computed by SkillSync&apos;s ranking engine, and AI features call real models live.
      </p>

      {current && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm">You already have a guest workspace open as a <strong>{current}</strong>.</p>
          <Button asChild size="sm" variant="outline"><Link href={`/guest/${current}`}>Continue where you left off <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
      )}
      {error && <p role="alert" className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>}
      <p role="status" aria-live="polite" className="sr-only">{pending ? `Setting up your ${pending} workspace` : ""}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {guestOptions.map((option) => {
          const Icon = option.icon;
          const busy = pending === option.kind;
          return (
            <section key={option.kind} aria-labelledby={`guest-${option.kind}`} className="flex flex-col rounded-xl border border-border bg-card p-6">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-6" aria-hidden="true" /></span>
              <h2 id={`guest-${option.kind}`} className="mt-4 text-xl font-bold">{option.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {option.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{f}</li>
                ))}
              </ul>
              <Button type="button" size="lg" disabled={!!pending} onClick={() => void start(option)} className="mt-6 w-full">
                {busy ? <><Loader2 className="animate-spin" aria-hidden="true" /> Setting up your workspace…</> : <>{option.title} <ArrowRight aria-hidden="true" /></>}
              </Button>
            </section>
          );
        })}
      </div>

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Guest workspaces are separate from institutional data and from other visitors, and are deleted automatically after 24 hours.
        If you upload a resume, its text is sent to the AI provider for parsing.
      </p>
    </main>
  );
}
