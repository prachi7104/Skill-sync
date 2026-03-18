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
    selected: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    rejected: "bg-rose-500/15 text-rose-300 border-rose-500/20",
    not_disclosed: "bg-slate-800 text-slate-300 border-white/10",
  };

  return <Badge className={cn("border", styles[outcome] ?? styles.not_disclosed)}>{formatCategoryLabel(outcome)}</Badge>;
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  return <Badge className="border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">{category.toUpperCase()}</Badge>;
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
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">{headerTitle}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isDetailView ? "Read how seniors approached this company and what helped them succeed." : "Browse interview experiences shared by students from your college."}
          </p>
        </div>
        {canSubmit ? (
          <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-500">
            <Link href="/student/companies/submit"><Plus className="h-4 w-4" /> Share Your Experience</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-5 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by company name" className="border-white/10 bg-slate-950 pl-10 text-slate-100" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", "placement", "internship", "ppo"].map((type) => (
            <button key={type} type="button" onClick={() => setDriveType(type)} className={cn("rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wide", driveType === type ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300")}>{formatCategoryLabel(type)}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", "1", "2", "3", "4", "5"].map((value) => (
            <button key={value} type="button" onClick={() => setDifficulty(value)} className={cn("rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wide", difficulty === value ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300")}>{value === "all" ? "All levels" : `${value}★+`}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-sm text-slate-400">Loading experiences...</div> : null}

      {!loading && !isDetailView ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.company_normalized} href={`/student/companies/${company.company_normalized}`}>
              <Card className="h-full border-white/10 bg-slate-900/60 transition-all hover:border-white/20 hover:bg-slate-900/80">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg text-white">{company.company_name}</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{company.experience_count} experiences</span>
                    <span>•</span>
                    <span>Avg difficulty {company.avg_difficulty}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={cn("h-4 w-4", star <= Math.round(Number(company.avg_difficulty)) ? "fill-amber-400" : "text-slate-700")} />)}
                </CardContent>
              </Card>
            </Link>
          ))}
          {companies.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-sm text-slate-400">No published experiences found for that search yet.</div> : null}
        </div>
      ) : null}

      {!loading && isDetailView ? (
        <div className="space-y-4">
          {experiences.map((experience) => (
            <article key={experience.id} className="space-y-4 rounded-2xl border border-white/5 bg-slate-900/60 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-white">{experience.show_name ? experience.student_name : experience.is_admin_posted ? "Anonymous — Shared by Admin" : "Anonymous"}</p>
                  <p className="text-sm text-slate-400">{experience.role_title ?? "Unknown role"} • {experience.batch_year ?? "Unknown"} Batch</p>
                </div>
                <div className="flex items-center gap-2">
                  <CategoryBadge category={experience.category_snapshot} />
                  <OutcomeBadge outcome={experience.outcome} />
                </div>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star key={value} className={cn("h-4 w-4", value <= experience.difficulty ? "fill-amber-400 text-amber-400" : "text-slate-600")} />
                ))}
                <span className="ml-2 text-xs text-slate-400">Difficulty {experience.difficulty}/5</span>
              </div>

              {experience.interview_process ? (
                <section>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Interview Process</h4>
                  <MarkdownRenderer content={experience.interview_process} />
                </section>
              ) : null}

              {experience.tips ? (
                <section>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Tips for Future Students</h4>
                  <MarkdownRenderer content={experience.tips} />
                </section>
              ) : null}

              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <button type="button" onClick={() => toggleHelpful(experience.id)} className={cn("flex items-center gap-1.5 text-xs", experience.has_voted ? "text-indigo-300" : "text-slate-400 hover:text-white")}>
                  <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({experience.helpful_count})
                </button>
                <span className="text-xs text-slate-600">{formatDistanceToNow(new Date(experience.created_at), { addSuffix: true })}</span>
              </div>
            </article>
          ))}
          {experiences.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-sm text-slate-400">No published experiences for this company yet.</div> : null}
        </div>
      ) : null}
    </div>
  );
}