"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, Star, ThumbsUp, Plus } from "lucide-react";

import MarkdownRenderer from "@/components/shared/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatCategoryLabel } from "@/lib/phase8-10";
import { slugToTitle } from "@/lib/content-utils";

type CompanySummary = {
  company_name: string;
  company_normalized: string;
  experience_count: number;
  avg_difficulty: string | number;
};

type Experience = {
  id: string;
  company_name: string;
  company_normalized: string;
  role_title: string | null;
  drive_type: string | null;
  outcome: string;
  interview_process: string | null;
  tips: string | null;
  difficulty: number;
  would_recommend: boolean | null;
  show_name: boolean;
  is_admin_posted: boolean;
  student_name: string | null;
  batch_year: number | null;
  category_snapshot: string | null;
  helpful_count: number;
  created_at: string;
  has_voted: boolean;
};

function OutcomeBadge({ outcome }: { outcome: string }) {
  const styles: Record<string, string> = {
    selected: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-none",
    rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-none",
    not_disclosed: "bg-muted text-muted-foreground border-border",
  };

  return <Badge variant="secondary" className={cn("text-[11px] uppercase tracking-wider", styles[outcome] ?? styles.not_disclosed)}>{formatCategoryLabel(outcome)}</Badge>;
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  return <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 border-none text-[11px] uppercase tracking-wider">{category}</Badge>;
}

export default function CompanyExperienceWall({ companySlug }: { companySlug?: string }) {
  const [search, setSearch] = useState(companySlug ? slugToTitle(companySlug) : "");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [driveType, setDriveType] = useState<string>("all");
  const [canSubmit, setCanSubmit] = useState(false);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  const isDetailView = Boolean(companySlug);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (difficulty !== "all") params.set("difficulty", difficulty);
      if (driveType !== "all") params.set("driveType", driveType);
      if (companySlug) params.set("company", companySlug);
      const res = await fetch(`/api/student/experiences?${params.toString()}`);
      const json = await res.json();
      setCanSubmit(Boolean(json.canSubmit));
      setCompanies(json.companies ?? []);
      setExperiences(json.experiences ?? []);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, [companySlug, difficulty, driveType, search]);

  async function toggleHelpful(experienceId: string) {
    const res = await fetch(`/api/student/experiences/${experienceId}/helpful`, { method: "POST" });
    if (!res.ok) return;
    const json = await res.json();
    setExperiences((current) => current.map((experience) => experience.id === experienceId
      ? {
          ...experience,
          helpful_count: json.helpfulCount,
          has_voted: json.hasVoted,
        }
      : experience));
  }

  const headerTitle = useMemo(() => companySlug ? slugToTitle(companySlug) : "Company Experience Wall", [companySlug]);

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{headerTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDetailView ? "Read how seniors approached this company and what helped them succeed." : "Browse interview experiences shared by students from your college."}
          </p>
        </div>
        {canSubmit ? (
          <Button asChild size="sm" className="gap-2 shrink-0">
            <Link href="/student/companies/submit"><Plus className="h-4 w-4" /> Share Experience</Link>
          </Button>
        ) : null}
      </div>

      <Separator />

      <div className="grid gap-4 rounded-md border border-border bg-card p-4 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by company name" className="pl-9 bg-transparent" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", "placement", "internship", "ppo"].map((type) => (
            <button key={type} type="button" onClick={() => setDriveType(type)} className={cn("rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors", driveType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>{formatCategoryLabel(type)}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", "1", "2", "3", "4", "5"].map((value) => (
            <button key={value} type="button" onClick={() => setDifficulty(value)} className={cn("rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors", difficulty === value ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground hover:bg-muted/80")}>{value === "all" ? "All levels" : `${value}★+`}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="rounded-md border border-border bg-card p-8 text-sm text-muted-foreground text-center animate-pulse">Loading experiences...</div> : null}

      {!loading && !isDetailView ? (
        <div className="grid gap-4 md:grid-cols-2">
          {companies.map((company) => (
            <Link key={company.company_normalized} href={`/student/companies/${company.company_normalized}`}>
              <Card className="h-full border-border bg-card transition-all hover:bg-secondary/50 rounded-md">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">{company.company_name}</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <span>{company.experience_count} experiences</span>
                    <span>•</span>
                    <span>Avg difficulty {company.avg_difficulty}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-1 pt-0">
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={cn("h-4 w-4", star <= Math.round(Number(company.avg_difficulty)) ? "fill-amber-400 text-amber-400" : "text-muted")} />)}
                </CardContent>
              </Card>
            </Link>
          ))}
          {companies.length === 0 ? <div className="md:col-span-2 rounded-md border border-dashed border-border bg-muted/30 p-8 text-center text-sm font-medium text-muted-foreground">No published experiences found for that search yet.</div> : null}
        </div>
      ) : null}

      {!loading && isDetailView ? (
        <div className="space-y-4">
          {experiences.map((experience) => (
            <article key={experience.id} className="space-y-5 rounded-md border border-border bg-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground text-base">{experience.show_name ? experience.student_name : experience.is_admin_posted ? "Anonymous — Shared by Admin" : "Anonymous"}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-0.5">{experience.role_title ?? "Unknown role"} <span className="mx-1">•</span> {experience.batch_year ?? "Unknown"} Batch</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CategoryBadge category={experience.category_snapshot} />
                  <OutcomeBadge outcome={experience.outcome} />
                </div>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star key={value} className={cn("h-4 w-4", value <= experience.difficulty ? "fill-amber-400 text-amber-400" : "text-muted")} />
                ))}
                <span className="ml-2 text-xs font-semibold text-muted-foreground">Difficulty {experience.difficulty}/5</span>
              </div>

              {experience.interview_process ? (
                <section className="bg-muted/30 p-4 rounded-md border border-border">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interview Process</h4>
                  <div className="text-sm text-foreground prose-sm prose-p:mb-2 prose-p:last:mb-0 max-w-none">
                    <MarkdownRenderer content={experience.interview_process} />
                  </div>
                </section>
              ) : null}

              {experience.tips ? (
                <section className="bg-primary/5 p-4 rounded-md border border-primary/10">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary max-w-none">Tips for Future Students</h4>
                  <div className="text-sm text-foreground prose-sm prose-p:mb-2 prose-p:last:mb-0">
                    <MarkdownRenderer content={experience.tips} />
                  </div>
                </section>
              ) : null}

              <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                <button type="button" onClick={() => toggleHelpful(experience.id)} className={cn("flex items-center gap-1.5 text-xs font-semibold transition-colors", experience.has_voted ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                  <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({experience.helpful_count})
                </button>
                <span className="text-xs font-medium text-muted-foreground">{formatDistanceToNow(new Date(experience.created_at), { addSuffix: true })}</span>
              </div>
            </article>
          ))}
          {experiences.length === 0 ? <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center text-sm font-medium text-muted-foreground">No published experiences for this company yet.</div> : null}
        </div>
      ) : null}
    </div>
  );
}