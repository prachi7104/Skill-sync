"use client";

import { useEffect, useState } from "react";
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
  deadline: z.string().optional(),
  rawJd: z.string().min(50, "At least 50 characters"),
  minCgpa: z.number().min(0).max(10).optional(),
  eligibleBranches: z.array(z.string()).optional(),
  eligibleBatchYears: z.array(z.number()).optional(),
  eligibleCategories: z.array(z.enum(["alpha", "beta", "gamma"])).optional(),
});

type FormValues = z.infer<typeof schema>;

type NewDriveFormProps = {
  onSuccess?: (driveId: string) => void;
};

export function NewDriveForm({ onSuccess }: NewDriveFormProps) {
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

    void loadSeasons();
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
      deadline: values.deadline ? new Date(`${values.deadline}T23:59:59+05:30`).toISOString() : null,
      seasonId: values.seasonId || null,
      minCgpa: values.minCgpa === 0 || !values.minCgpa ? null : values.minCgpa,
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
        const data = (await res.json()) as { drive?: { id?: string } };
        onSuccess?.(data.drive?.id ?? "");
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
      setValue("eligibleBranches", current.filter((b) => b !== val));
    } else {
      setValue("eligibleBranches", [...current, val]);
    }
  };

  const toggleBatchYear = (val: number) => {
    const current = selectedBatchYears;
    if (current.includes(val)) {
      setValue("eligibleBatchYears", current.filter((y) => y !== val));
    } else {
      setValue("eligibleBatchYears", [...current, val]);
    }
  };

  const toggleCategory = (val: "alpha" | "beta" | "gamma") => {
    const current = selectedCategories;
    if (current.includes(val)) {
      setValue("eligibleCategories", current.filter((c) => c !== val));
    } else {
      setValue("eligibleCategories", [...current, val]);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-10">
      <div className="flex items-center justify-center space-x-4">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold",
            step === 1 ? "border-primary/30 bg-primary text-foreground" : "border-success/20 bg-success/10 text-foreground"
          )}
        >
          {step > 1 ? <Check className="h-5 w-5" /> : "1"}
        </div>
        <div className={cn("h-px w-20", step > 1 ? "bg-success/10" : "bg-card")} />
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold",
            step === 2 ? "border-primary/30 bg-primary text-foreground" : "border-border text-muted-foreground"
          )}
        >
          2
        </div>
      </div>

      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{step === 1 ? "Basic Drive Details" : "JD & Eligibility"}</CardTitle>
          <CardDescription>
            {step === 1 ? "Provide the company and role information." : "Set applicant requirements and paste the job description."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Company Name *
                    </Label>
                    <Input id="company" {...register("company")} placeholder="e.g. Google" />
                    {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roleTitle">Role Title *</Label>
                    <Input id="roleTitle" {...register("roleTitle")} placeholder="e.g. SDE Intern" />
                    {errors.roleTitle && <p className="text-xs text-destructive">{errors.roleTitle.message}</p>}
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

                <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                  <input type="checkbox" {...register("rankingsVisible")} />
                  Allow students to view ranking details for this drive
                </label>

                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={nextStep} className="gap-2 bg-primary hover:bg-primary/90">
                    Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {error && <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}

                <div className="space-y-3">
                  <Label htmlFor="rawJd" className="text-base font-semibold">Job Description *</Label>
                  <Textarea id="rawJd" {...register("rawJd")} rows={12} placeholder="Paste the full JD text here..." className="font-sans leading-relaxed" />
                  <div className="flex items-center justify-between text-xs">
                    <p className={cn("font-medium", jdValue.length < 200 || jdValue.length > 5000 ? "text-warning" : "text-success")}>
                      {jdValue.length.toLocaleString()} characters
                    </p>
                    {errors.rawJd && <p className="font-medium text-destructive">{errors.rawJd.message}</p>}
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="minCgpa" className="text-base font-semibold">Minimum CGPA</Label>
                    <span className="text-xl font-mono font-bold text-primary">{minCgpa === 0 ? "No minimum" : minCgpa.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    id="minCgpa"
                    min="0"
                    max="10"
                    step="0.5"
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-card accent-primary"
                    {...register("minCgpa", { valueAsNumber: true })}
                  />
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Students below this CGPA are excluded from ranking</p>
                </div>

                <div className="space-y-4 border-t pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Eligible Branches</Label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setValue("eligibleBranches", UPES_BRANCHES.map((b) => b.value))}
                        className="border-none bg-transparent p-0 text-xs text-primary hover:text-primary hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("eligibleBranches", [])}
                        className="border-none bg-transparent p-0 text-xs text-muted-foreground hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                    {UPES_BRANCHES.map((branch) => (
                      <label key={branch.value} className="group flex cursor-pointer items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded border-2 shadow-sm transition-colors",
                            selectedBranches.includes(branch.value)
                              ? "border-primary/30 bg-primary"
                              : "border-border group-hover:border-border"
                          )}
                        >
                          {selectedBranches.includes(branch.value) && <Check className="h-3.5 w-3.5 stroke-[3px] text-foreground" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedBranches.includes(branch.value)}
                          onChange={() => toggleBranch(branch.value)}
                        />
                        <span className={cn("transition-colors", selectedBranches.includes(branch.value) ? "font-medium text-foreground" : "text-muted-foreground")}>
                          {branch.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedBranches.length === 0 && <p className="text-xs italic text-muted-foreground">All branches eligible</p>}
                </div>

                <div className="space-y-4 border-t pt-4">
                  <Label className="text-base font-semibold">Eligible Batch Years</Label>
                  <div className="flex flex-wrap gap-2">
                    {[2024, 2025, 2026, 2027].map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => toggleBatchYear(year)}
                        className={cn(
                          "rounded-md border px-4 py-2 text-sm font-semibold shadow-sm transition-all",
                          selectedBatchYears.includes(year)
                            ? "border-primary/30 bg-primary text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t pb-4 pt-4">
                  <Label className="text-base font-semibold">Target Categories</Label>
                  <div className="flex gap-2">
                    {(["alpha", "beta", "gamma"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          "rounded-md border px-6 py-2 text-sm font-semibold capitalize shadow-sm transition-all",
                          selectedCategories.includes(cat)
                            ? "border-primary/30 bg-primary text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between border-t pt-6">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)} className="gap-2 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4" /> Back to details
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[140px] bg-primary hover:bg-primary/90">
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
