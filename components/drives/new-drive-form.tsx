"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UPES_BRANCHES } from "@/lib/constants/branches";
import { cn } from "@/lib/utils";
import { Check, Upload } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<Array<{ id: string; name: string }>>([]);

  const {
    register,
    handleSubmit,
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
      setValue("eligibleBranches", current.filter((b) => b !== val), { shouldDirty: true });
    } else {
      setValue("eligibleBranches", [...current, val], { shouldDirty: true });
    }
  };

  const toggleBatchYear = (val: number) => {
    const current = selectedBatchYears;
    if (current.includes(val)) {
      setValue("eligibleBatchYears", current.filter((y) => y !== val), { shouldDirty: true });
    } else {
      setValue("eligibleBatchYears", [...current, val], { shouldDirty: true });
    }
  };

  const toggleCategory = (val: "alpha" | "beta" | "gamma") => {
    const current = selectedCategories;
    if (current.includes(val)) {
      setValue("eligibleCategories", current.filter((c) => c !== val), { shouldDirty: true });
    } else {
      setValue("eligibleCategories", [...current, val], { shouldDirty: true });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Create New Drive</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure details, eligibility, and job description.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-10">
        {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
            </div>
        )}

        <div className="space-y-6">
            <h2 className="text-sm font-semibold text-foreground tracking-wide border-b border-border pb-2">BASIC DETAILS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <Label htmlFor="company" className="text-sm font-medium">Company Name</Label>
                    <Input id="company" placeholder="e.g. Google, Microsoft" {...register("company")} />
                    {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="roleTitle" className="text-sm font-medium">Role Title</Label>
                    <Input id="roleTitle" placeholder="e.g. SDE Intern" {...register("roleTitle")} />
                    {errors.roleTitle && <p className="text-xs text-destructive">{errors.roleTitle.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                    <Input id="location" placeholder="e.g. Gurgaon / Remote" {...register("location")} />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="packageOffered" className="text-sm font-medium">Package Offered</Label>
                    <Input id="packageOffered" placeholder="e.g. ₹7 LPA" {...register("packageOffered")} />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="deadline" className="text-sm font-medium">Application Deadline</Label>
                    <Input id="deadline" type="date" {...register("deadline")} />
                </div>

                <div className="space-y-1.5 flex flex-col">
                    <Label htmlFor="seasonId" className="text-sm font-medium mb-1">Season</Label>
                    <select
                        id="seasonId"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
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

                <div className="space-y-1.5 flex flex-col">
                    <Label htmlFor="placementType" className="text-sm font-medium mb-1">Placement Type</Label>
                    <select
                        id="placementType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                        {...register("placementType")}
                    >
                        <option value="placement">Full-time Placement</option>
                        <option value="internship">Internship</option>
                        <option value="ppo">Pre-Placement Offer (PPO)</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            <label className="flex items-center gap-2 mt-4 cursor-pointer">
                <input type="checkbox" className="rounded border-input" {...register("rankingsVisible")} />
                <span className="text-sm text-foreground">Allow students to view their rankings for this drive</span>
            </label>
        </div>


        <div className="space-y-6">
            <h2 className="text-sm font-semibold text-foreground tracking-wide border-b border-border pb-2">JOB DESCRIPTION</h2>
            
            <div className="space-y-4">
                <div className="border border-dashed border-border rounded-md p-8 text-center hover:bg-accent transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-sm text-foreground">Click to upload job description</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, up to 10MB</p>
                </div>
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or Paste Text</span>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="rawJd" className="text-sm font-medium">Raw JD Content</Label>
                    <Textarea id="rawJd" {...register("rawJd")} rows={10} placeholder="Paste the full job description text here..." className="font-sans" />
                    {errors.rawJd && <p className="text-xs text-destructive">{errors.rawJd.message}</p>}
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <h2 className="text-sm font-semibold text-foreground tracking-wide border-b border-border pb-2">ELIGIBILITY CRITERIA</h2>
            
            <div className="space-y-8">
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="minCgpa" className="text-sm font-medium">Minimum CGPA</Label>
                        <span className="text-sm font-medium text-muted-foreground">{minCgpa === 0 ? "No minimum" : minCgpa.toFixed(1)}</span>
                    </div>
                    <input
                        type="range"
                        id="minCgpa"
                        min="0"
                        max="10"
                        step="0.5"
                        className="w-full cursor-pointer appearance-none rounded-lg bg-secondary h-2 accent-primary"
                        {...register("minCgpa", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Students below this CGPA will be excluded from the ranking</p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Eligible Branches</Label>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setValue("eligibleBranches", UPES_BRANCHES.map((b) => b.value))} className="text-xs text-primary hover:underline">Select All</button>
                            <button type="button" onClick={() => setValue("eligibleBranches", [])} className="text-xs text-muted-foreground hover:underline">Clear All</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {UPES_BRANCHES.map((branch) => {
                            const isSelected = selectedBranches.includes(branch.value);
                            return (
                                <label key={branch.value} className="flex cursor-pointer items-center gap-2">
                                    <div className={cn("flex h-4 w-4 items-center justify-center rounded border transition-colors", isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                                        {isSelected && <Check className="h-3 w-3" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleBranch(branch.value)} />
                                    <span className="text-sm">{branch.label}</span>
                                </label>
                            );
                        })}
                    </div>
                    {selectedBranches.length === 0 && <p className="text-xs text-muted-foreground">No branches selected — all branches will be eligible by default</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Eligible Batch Years</Label>
                        <div className="flex flex-wrap gap-2">
                            {[2024, 2025, 2026, 2027].map((year) => {
                                const isSelected = selectedBatchYears.includes(year);
                                return (
                                    <button
                                        key={year}
                                        type="button"
                                        onClick={() => toggleBatchYear(year)}
                                        className={cn("rounded-md border px-3 py-1.5 text-sm font-medium transition-colors", isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-card border-input hover:bg-accent hover:text-accent-foreground")}
                                    >
                                        {year}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Target Categories</Label>
                        <div className="flex flex-wrap gap-2">
                            {(["alpha", "beta", "gamma"] as const).map((cat) => {
                                const isSelected = selectedCategories.includes(cat);
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => toggleCategory(cat)}
                                        className={cn("rounded-md border px-3 py-1.5 text-sm font-medium capitalize transition-colors", isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-card border-input hover:bg-accent hover:text-accent-foreground")}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-end border-t border-border pt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Create Drive"}
          </Button>
        </div>
      </form>
    </div>
  );
}
