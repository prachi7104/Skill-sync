"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const driveFormSchema = z.object({
  company: z.string().min(1, "Company name is required").max(255),
  roleTitle: z.string().min(1, "Role title is required").max(255),
  location: z.string().max(255).optional(),
  packageOffered: z.string().max(100).optional(),
  rawJd: z.string().min(10, "Job description must be at least 10 characters"),
  minCgpa: z.coerce.number().min(0).max(10).optional(),
  eligibleBranches: z.string().optional(),
  eligibleBatchYears: z.string().optional(),
  eligibleCategories: z.string().optional(),
  deadline: z.string().optional(),
});

type DriveFormValues = z.infer<typeof driveFormSchema>;

export default function NewDrivePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriveFormValues>({
    resolver: zodResolver(driveFormSchema),
  });

  async function onSubmit(values: DriveFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      // Transform comma-separated strings into arrays
      const payload = {
        company: values.company,
        roleTitle: values.roleTitle,
        location: values.location || null,
        packageOffered: values.packageOffered || null,
        rawJd: values.rawJd,
        minCgpa: values.minCgpa || null,
        eligibleBranches: values.eligibleBranches
          ? values.eligibleBranches.split(",").map((b) => b.trim()).filter(Boolean)
          : null,
        eligibleBatchYears: values.eligibleBatchYears
          ? values.eligibleBatchYears.split(",").map((y) => parseInt(y.trim())).filter((n) => !isNaN(n))
          : null,
        eligibleCategories: values.eligibleCategories
          ? values.eligibleCategories.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean)
          : null,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
      };

      const res = await fetch("/api/drives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create drive");
      }

      router.push("/faculty/drives");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Placement Drive</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to create a new placement drive.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Drive Details</CardTitle>
          <CardDescription>Company info and job description.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Company */}
            <div className="space-y-1.5">
              <Label htmlFor="company">Company Name *</Label>
              <Input id="company" {...register("company")} placeholder="e.g., Google" />
              {errors.company && (
                <p className="text-xs text-red-500">{errors.company.message}</p>
              )}
            </div>

            {/* Role Title */}
            <div className="space-y-1.5">
              <Label htmlFor="roleTitle">Role Title *</Label>
              <Input id="roleTitle" {...register("roleTitle")} placeholder="e.g., SDE Intern" />
              {errors.roleTitle && (
                <p className="text-xs text-red-500">{errors.roleTitle.message}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register("location")} placeholder="e.g., Bangalore / Remote" />
            </div>

            {/* Package */}
            <div className="space-y-1.5">
              <Label htmlFor="packageOffered">Package Offered</Label>
              <Input id="packageOffered" {...register("packageOffered")} placeholder="e.g., ₹6-8 LPA" />
            </div>

            {/* Raw JD */}
            <div className="space-y-1.5">
              <Label htmlFor="rawJd">Job Description *</Label>
              <Textarea
                id="rawJd"
                {...register("rawJd")}
                rows={8}
                placeholder="Paste the full job description here..."
              />
              {errors.rawJd && (
                <p className="text-xs text-red-500">{errors.rawJd.message}</p>
              )}
            </div>

            {/* Eligibility */}
            <div className="border-t pt-5">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Eligibility Criteria (optional)
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="minCgpa">Minimum CGPA</Label>
                  <Input
                    id="minCgpa"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    {...register("minCgpa")}
                    placeholder="e.g., 7.0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eligibleBranches">Eligible Branches</Label>
                  <Input
                    id="eligibleBranches"
                    {...register("eligibleBranches")}
                    placeholder="e.g., Computer Science, IT"
                  />
                  <p className="text-xs text-gray-400">Comma-separated</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eligibleBatchYears">Batch Years</Label>
                  <Input
                    id="eligibleBatchYears"
                    {...register("eligibleBatchYears")}
                    placeholder="e.g., 2025, 2026"
                  />
                  <p className="text-xs text-gray-400">Comma-separated</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eligibleCategories">Categories</Label>
                  <Input
                    id="eligibleCategories"
                    {...register("eligibleCategories")}
                    placeholder="e.g., alpha, beta"
                  />
                  <p className="text-xs text-gray-400">alpha, beta, gamma</p>
                </div>
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="datetime-local" {...register("deadline")} />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/faculty/drives")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Drive"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
