"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UPES_BRANCHES } from "@/lib/constants/branches";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, ChevronLeft, Calendar, MapPin, Briefcase, IndianRupee } from "lucide-react";

const schema = z.object({
  company: z.string().min(1, "Required"),
  roleTitle: z.string().min(1, "Required"),
  location: z.string().optional(),
  packageOffered: z.string().optional(),
  seasonId: z.string().uuid().optional().nullable(),
  rankingsVisible: z.boolean().optional(),
  placementType: z.enum(["placement", "internship", "ppo", "other"]).optional(),
  deadline: z.string().optional(),          // YYYY-MM-DD string from date input
  rawJd: z.string().min(50, "At least 50 characters"),
  minCgpa: z.number().min(0).max(10).optional(),
  eligibleBranches: z.array(z.string()).optional(),
  eligibleBatchYears: z.array(z.number()).optional(),
  eligibleCategories: z.array(z.enum(["alpha", "beta", "gamma"])).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewDrivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/faculty/drives";
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string }>>([]);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      minCgpa: 0,
      eligibleBranches: [],
      eligibleBatchYears: [],
      eligibleCategories: [],
      rankingsVisible: false,
      placementType: "placement",
      seasonId: null,
    },
  });

  const jdValue = watch("rawJd") ?? "";
  const minCgpa = watch("minCgpa") ?? 0;
  const selectedBranches = watch("eligibleBranches") ?? [];
  const selectedBatchYears = watch("eligibleBatchYears") ?? [];
  const selectedCategories = watch("eligibleCategories") ?? [];

  useEffect(() => {
    async function loadSeasons() {
      try {
        const res = await fetch("/api/seasons");
        if (!res.ok) return;
        const data = await res.json();
        setSeasons(data.seasons ?? []);
      } catch {
        setSeasons([]);
      }
    }

    loadSeasons();
  }, []);

  async function nextStep() {
    const isValid = await trigger(["company", "roleTitle"]);
    if (isValid) setStep(2);
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setError(null);

    const payload = {
      ...values,
      deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
      seasonId: values.seasonId || null,
      minCgpa: (values.minCgpa === 0 || !values.minCgpa) ? null : values.minCgpa,
      eligibleBranches: values.eligibleBranches?.length ? values.eligibleBranches : null,
      eligibleBatchYears: values.eligibleBatchYears?.length ? values.eligibleBatchYears : null,
      eligibleCategories: values.eligibleCategories?.length ? values.eligibleCategories : null,
    };

    try {
      const res = await fetch("/api/drives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(returnTo);
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.message ?? "Failed to create drive");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const toggleBranch = (val: string) => {
    const current = selectedBranches;
    if (current.includes(val)) {
      setValue("eligibleBranches", current.filter(b => b !== val));
    } else {
      setValue("eligibleBranches", [...current, val]);
    }
  };

  const toggleBatchYear = (val: number) => {
    const current = selectedBatchYears;
    if (current.includes(val)) {
      setValue("eligibleBatchYears", current.filter(y => y !== val));
    } else {
      setValue("eligibleBatchYears", [...current, val]);
    }
  };

  const toggleCategory = (val: "alpha" | "beta" | "gamma") => {
    const current = selectedCategories;
    if (current.includes(val)) {
      setValue("eligibleCategories", current.filter(c => c !== val));
    } else {
      setValue("eligibleCategories", [...current, val]);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-10">
      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold",
          step === 1 ? "border-indigo-600 bg-indigo-600 text-white" : "border-emerald-500 bg-emerald-500 text-white"
        )}>
          {step > 1 ? <Check className="h-5 w-5" /> : "1"}
        </div>
        <div className={cn("h-px w-20", step > 1 ? "bg-emerald-500" : "bg-slate-800")} />
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold",
          step === 2 ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-800 text-slate-500"
        )}>
          2
        </div>
      </div>

      <Card className="border-t-4 border-t-indigo-500">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {step === 1 ? "Basic Drive Details" : "JD & Eligibility"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Provide the company and role information."
              : "Set applicant requirements and paste the job description."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Company Name *
                    </Label>
                    <Input id="company" {...register("company")} placeholder="e.g. Google" />
                    {errors.company && <p className="text-xs text-red-500">{errors.company.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roleTitle">Role Title *</Label>
                    <Input id="roleTitle" {...register("roleTitle")} placeholder="e.g. SDE Intern" />
                    {errors.roleTitle && <p className="text-xs text-red-500">{errors.roleTitle.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Location
                    </Label>
                    <Input id="location" {...register("location")} placeholder="e.g. Gurgaon / Remote" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packageOffered" className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      Package Offered
                    </Label>
                    <Input id="packageOffered" {...register("packageOffered")} placeholder="e.g. ₹7 LPA" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Application Deadline
                    </Label>
                    <Input id="deadline" type="date" {...register("deadline")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seasonId">Season</Label>
                    <select
                      id="seasonId"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      {...register("seasonId")}
                    >
                      <option value="">No season</option>
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="placementType">Placement Type</Label>
                    <select
                      id="placementType"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      {...register("placementType")}
                    >
                      <option value="placement">Full-time Placement</option>
                      <option value="internship">Internship</option>
                      <option value="ppo">Pre-Placement Offer (PPO)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm">
                  <input type="checkbox" {...register("rankingsVisible")} />
                  Allow students to view ranking details for this drive
                </label>

                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={nextStep} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* A. Job Description */}
                <div className="space-y-3">
                  <Label htmlFor="rawJd" className="text-base font-semibold">Job Description *</Label>
                  <Textarea
                    id="rawJd"
                    {...register("rawJd")}
                    rows={12}
                    placeholder="Paste the full JD text here..."
                    className="font-sans leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-xs">
                    <p className={cn(
                      "font-medium",
                      jdValue.length < 200 || jdValue.length > 5000 ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {jdValue.length.toLocaleString()} characters
                    </p>
                    {errors.rawJd && <p className="text-red-500 font-medium">{errors.rawJd.message}</p>}
                  </div>
                </div>

                {/* B. Minimum CGPA slider */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="minCgpa" className="text-base font-semibold">Minimum CGPA</Label>
                    <span className="text-xl font-mono font-bold text-indigo-400">
                      {minCgpa === 0 ? "No minimum" : minCgpa.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    id="minCgpa"
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    {...register("minCgpa", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Students below this CGPA are excluded from ranking
                  </p>
                </div>

                {/* C. Eligible Branches */}
                <div className="space-y-4 pt-4 border-t text-sm">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Eligible Branches</Label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setValue("eligibleBranches", UPES_BRANCHES.map(b => b.value))}
                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline border-none bg-transparent p-0"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("eligibleBranches", [])}
                        className="text-xs text-muted-foreground hover:underline border-none bg-transparent p-0"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4">
                    {UPES_BRANCHES.map((branch) => (
                      <label
                        key={branch.value}
                        className="flex items-center gap-2.5 group cursor-pointer"
                      >
                        <div className={cn(
                          "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors shadow-sm",
                          selectedBranches.includes(branch.value)
                            ? "bg-indigo-600 border-indigo-600"
                            : "border-slate-700 group-hover:border-slate-600"
                        )}>
                          {selectedBranches.includes(branch.value) && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedBranches.includes(branch.value)}
                          onChange={() => toggleBranch(branch.value)}
                        />
                        <span className={cn(
                          "transition-colors",
                          selectedBranches.includes(branch.value) ? "text-white font-medium" : "text-muted-foreground"
                        )}>
                          {branch.value}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedBranches.length === 0 && (
                    <p className="text-xs italic text-muted-foreground">All branches eligible</p>
                  )}
                </div>

                {/* D. Batch Years */}
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-semibold">Eligible Batch Years</Label>
                  <div className="flex flex-wrap gap-2">
                    {[2024, 2025, 2026, 2027].map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => toggleBatchYear(year)}
                        className={cn(
                          "px-4 py-2 rounded-md border text-sm font-semibold transition-all shadow-sm",
                          selectedBatchYears.includes(year)
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500/50"
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* E. Categories */}
                <div className="space-y-4 pt-4 border-t pb-4">
                  <Label className="text-base font-semibold">Target Categories</Label>
                  <div className="flex gap-2">
                    {(["alpha", "beta", "gamma"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          "px-6 py-2 rounded-md border text-sm font-semibold capitalize transition-all shadow-sm",
                          selectedCategories.includes(cat)
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500/50"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200 font-medium">
                    {error}
                  </div>
                )}

                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="gap-2 text-slate-500 hover:text-slate-200"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back to details
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 min-w-[140px]"
                  >
                    {isSubmitting ? "Creating..." : "Create Drive →"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
