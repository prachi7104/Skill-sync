"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Lock,
  ChevronRight,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { useStudent } from "@/app/(student)/providers/student-provider";
import { cn } from "@/lib/utils";

type StepKey = "identity" | "academics" | "skills" | "projects" | "experience" | "extras";

interface StepDef {
  key: StepKey;
  label: string;
  description: string;
  required: (keyof ProfileForm)[];
}

const STEPS: StepDef[] = [
  {
    key: "identity",
    label: "Identity",
    description: "Your university IDs and contact",
    required: ["sapId", "rollNo"],
  },
  {
    key: "academics",
    label: "Academics",
    description: "Your degree details and scores",
    required: ["cgpa", "branch", "batchYear", "tenthPercentage", "twelfthPercentage"],
  },
  {
    key: "skills",
    label: "Skills",
    description: "Technical and domain skills",
    required: [],
  },
  {
    key: "projects",
    label: "Projects",
    description: "Academic and personal projects",
    required: [],
  },
  {
    key: "experience",
    label: "Experience",
    description: "Internships and work experience",
    required: [],
  },
  {
    key: "extras",
    label: "Extras",
    description: "Certifications, research, profiles",
    required: [],
  },
];

interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl: string;
  startDate: string;
  endDate: string;
}

interface Experience {
  id: string;
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
  isPresent: boolean;
}

interface Certification {
  id: string;
  title: string;
  issuer: string;
  year: string;
}

interface CodingProfile {
  id: string;
  platform: string;
  username: string;
  url: string;
}

interface ResearchPaper {
  id: string;
  title: string;
  journal: string;
  year: string;
  url: string;
}

interface ProfileForm {
  sapId: string;
  rollNo: string;
  phone: string;
  linkedin: string;
  portfolio: string;

  cgpa: string;
  branch: string;
  batchYear: string;
  semester: string;
  tenthPercentage: string;
  twelfthPercentage: string;

  skills: string[];

  projects: Project[];

  experience: Experience[];

  certifications: Certification[];
  codingProfiles: CodingProfile[];
  researchPapers: ResearchPaper[];
  softSkills: string[];
  achievements: string;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function toFormFromStudent(student: Record<string, unknown> | null): ProfileForm {
  if (!student) {
    return {
      sapId: "",
      rollNo: "",
      phone: "",
      linkedin: "",
      portfolio: "",
      cgpa: "",
      branch: "",
      batchYear: "",
      semester: "",
      tenthPercentage: "",
      twelfthPercentage: "",
      skills: [],
      projects: [],
      experience: [],
      certifications: [],
      codingProfiles: [],
      researchPapers: [],
      softSkills: [],
      achievements: "",
    };
  }

  const skills = (student.skills as Array<{ name: string }> | null) ?? [];
  const projects =
    (student.projects as Array<{
      title: string;
      description?: string;
      techStack?: string[];
      url?: string;
      startDate?: string;
      endDate?: string;
    }> | null) ?? [];
  const work =
    (student.workExperience as Array<{
      company: string;
      role: string;
      description?: string;
      startDate?: string;
      endDate?: string;
    }> | null) ?? [];
  const certs =
    (student.certifications as Array<{ title: string; issuer?: string; year?: string }> | null) ?? [];
  const coding =
    (student.codingProfiles as Array<{ platform: string; username?: string; url?: string }> | null) ?? [];
  const research =
    (student.researchPapers as Array<{ title: string; journal?: string; year?: string; url?: string }> | null) ?? [];

  return {
    sapId: (student.sapId as string) ?? "",
    rollNo: (student.rollNo as string) ?? "",
    phone: (student.phone as string) ?? "",
    linkedin: (student.linkedin as string) ?? "",
    portfolio: "",
    cgpa: student.cgpa != null ? String(student.cgpa) : "",
    branch: (student.branch as string) ?? "",
    batchYear: student.batchYear != null ? String(student.batchYear) : "",
    semester: student.semester != null ? String(student.semester) : "",
    tenthPercentage: student.tenthPercentage != null ? String(student.tenthPercentage) : "",
    twelfthPercentage: student.twelfthPercentage != null ? String(student.twelfthPercentage) : "",
    skills: skills.map((s) => s.name),
    projects: projects.map((p) => ({
      id: uid(),
      title: p.title,
      description: p.description ?? "",
      techStack: p.techStack ?? [],
      githubUrl: p.url ?? "",
      startDate: p.startDate ?? "",
      endDate: p.endDate ?? "",
    })),
    experience: work.map((w) => ({
      id: uid(),
      company: w.company,
      role: w.role,
      description: w.description ?? "",
      startDate: w.startDate ?? "",
      endDate: w.endDate ?? "",
      isPresent: !w.endDate,
    })),
    certifications: certs.map((c) => ({
      id: uid(),
      title: c.title,
      issuer: c.issuer ?? "",
      year: c.year ?? "",
    })),
    codingProfiles: coding.map((c) => ({
      id: uid(),
      platform: c.platform,
      username: c.username ?? "",
      url: c.url ?? "",
    })),
    researchPapers: research.map((r) => ({
      id: uid(),
      title: r.title,
      journal: r.journal ?? "",
      year: r.year ?? "",
      url: r.url ?? "",
    })),
    softSkills: (student.softSkills as string[] | null) ?? [],
    achievements: ((student.achievements as Array<{ title: string }> | null) ?? [])
      .map((a) => a.title)
      .join("\n"),
  };
}

function buildPatch(step: StepKey, form: ProfileForm): Record<string, unknown> {
  const patches: Record<StepKey, () => Record<string, unknown>> = {
    identity: () => ({
      sapId: form.sapId || null,
      rollNo: form.rollNo || null,
      phone: form.phone || null,
      linkedin: form.linkedin || null,
    }),
    academics: () => ({
      cgpa: form.cgpa ? Number(form.cgpa) : null,
      branch: form.branch || null,
      batchYear: form.batchYear ? Number(form.batchYear) : null,
      semester: form.semester ? Number(form.semester) : null,
      tenthPercentage: form.tenthPercentage ? Number(form.tenthPercentage) : null,
      twelfthPercentage: form.twelfthPercentage ? Number(form.twelfthPercentage) : null,
    }),
    skills: () => ({
      skills: form.skills.map((name) => ({ name })),
      softSkills: form.softSkills,
    }),
    projects: () => ({
      projects: form.projects.map((p) => ({
        title: p.title,
        description: p.description,
        techStack: p.techStack,
        url: p.githubUrl,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
    }),
    experience: () => ({
      workExperience: form.experience.map((e) => ({
        company: e.company,
        role: e.role,
        description: e.description,
        startDate: e.startDate,
        endDate: e.isPresent ? "" : e.endDate,
      })),
    }),
    extras: () => ({
      certifications: form.certifications.map((c) => ({
        title: c.title,
        issuer: c.issuer,
        year: c.year,
      })),
      codingProfiles: form.codingProfiles.map((c) => ({
        platform: c.platform,
        username: c.username,
        url: c.url,
      })),
      researchPapers: form.researchPapers.map((r) => ({
        title: r.title,
        journal: r.journal,
        year: r.year,
        url: r.url,
      })),
      achievements: form.achievements
        .split("\n")
        .filter(Boolean)
        .map((a) => ({ title: a.trim() })),
    }),
  };
  return patches[step]();
}

function isStepComplete(step: StepDef, form: ProfileForm): boolean {
  return step.required.every((field) => {
    const val = form[field];
    if (typeof val === "string") return val.trim() !== "";
    return val != null;
  });
}

const BRANCHES = [
  "AIML",
  "CSF",
  "Data Science",
  "DevOps",
  "Full Stack",
  "CCVT",
  "GG",
  "IoT",
  "Bigdata",
  "Other",
];

const CURRENT_YEAR = new Date().getFullYear();
const BATCH_YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2, CURRENT_YEAR + 3];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function OnboardingPage() {
  const { student, isLoading, refresh } = useStudent();
  const router = useRouter();

  const [activeStep, setActiveStep] = useState<StepKey>("identity");
  const [form, setForm] = useState<ProfileForm>(() =>
    toFormFromStudent((student as Record<string, unknown> | null) ?? null),
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [resumeState, setResumeState] = useState<"idle" | "uploading" | "parsing" | "done" | "error">("idle");
  const [resumeStatusText, setResumeStatusText] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadlineRef = useRef(0);

  const [autofillVersion, setAutofillVersion] = useState(0);
  const prevSkillsRef = useRef<string[]>([]);

  const isUserChangeRef = useRef(false);

  useEffect(() => {
    if (!student) return;
    isUserChangeRef.current = false;
    const newForm = toFormFromStudent(student as unknown as Record<string, unknown>);
    setForm(newForm);

    const newSkills = newForm.skills;
    if (prevSkillsRef.current.length === 0 && newSkills.length > 0) {
      setAutofillVersion((v) => v + 1);
    }
    prevSkillsRef.current = newSkills;
  }, [student]);

  const stepStates = useMemo(
    () => STEPS.map((s) => ({ ...s, done: isStepComplete(s, form) })),
    [form],
  );

  const allRequired = stepStates
    .filter((s) => s.required.length > 0)
    .every((s) => s.done);

  const currentStepIndex = STEPS.findIndex((s) => s.key === activeStep);

  function isStepUnlocked(stepIndex: number): boolean {
    for (let i = 0; i < stepIndex; i++) {
      if (STEPS[i].required.length > 0 && !stepStates[i].done) return false;
    }
    return true;
  }

  useEffect(() => {
    if (!isUserChangeRef.current) return;

    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        const patch = buildPatch(activeStep, form);
        const res = await fetch("/api/student/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error("save-failed");
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        setSaveState("error");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeStep, form]);

  const setField = useCallback(<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    isUserChangeRef.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function handleResumeUpload(file: File) {
    if (pollRef.current) clearInterval(pollRef.current);

    setResumeState("uploading");
    setResumeStatusText("Uploading resume...");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("source", "onboarding");

    const uploadRes = await fetch("/api/student/resume", { method: "POST", body: fd });
    if (!uploadRes.ok) {
      setResumeState("error");
      setResumeStatusText("Upload failed. Try again.");
      return;
    }

    const uploadData = await uploadRes.json();
    const jobId: string | null = uploadData?.jobId ?? null;

    setResumeState("parsing");
    setResumeStatusText("Parsing resume, autofilling your profile...");
    pollDeadlineRef.current = Date.now() + 3 * 60 * 1000;

    pollRef.current = setInterval(async () => {
      if (Date.now() > pollDeadlineRef.current) {
        if (pollRef.current) clearInterval(pollRef.current);
        setResumeState("error");
        setResumeStatusText("Parsing is taking longer than expected. Fill manually or try re-uploading.");
        return;
      }

      if (jobId) {
        const jobRes = await fetch(`/api/jobs/${jobId}`).catch(() => null);
        if (!jobRes?.ok) return;
        const jobData = await jobRes.json();
        if (jobData.status === "completed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setResumeState("done");
          setResumeStatusText("Resume parsed! Profile autofilled. Review and continue.");
          await refresh();
        } else if (jobData.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setResumeState("error");
          setResumeStatusText("Parsing failed. You can still fill your profile manually.");
        }
      } else {
        const profileRes = await fetch("/api/student/profile").catch(() => null);
        if (!profileRes?.ok) return;
        const profileData = await profileRes.json();
        if (profileData.data?.profile?.resumeParsedAt) {
          if (pollRef.current) clearInterval(pollRef.current);
          setResumeState("done");
          setResumeStatusText("Resume parsed! Profile autofilled.");
          await refresh();
        }
      }
    }, 3000);
  }

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
    },
    [],
  );

  async function handleNext() {
    const patch = buildPatch(activeStep, form);
    await fetch("/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setActiveStep(STEPS[nextIndex].key);
    }
  }

  async function handleFinish() {
    const patch = buildPatch(activeStep, form);
    await fetch("/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});
    router.push("/student/dashboard");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-white">
            Skill<span className="text-indigo-400">Sync</span>
          </span>
          <span className="text-slate-500">.</span>
          <span className="text-sm text-slate-400">Profile Setup</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {saveState === "saving" && (
            <span className="flex items-center gap-1 text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </span>
          )}
          {saveState === "saved" && (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </span>
          )}
          {saveState === "error" && (
            <span className="flex items-center gap-1 text-rose-400">
              <AlertCircle className="h-3 w-3" /> Save failed
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl gap-8 px-4 py-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-8 space-y-1">
            <p className="mb-4 px-2 text-xs font-bold uppercase tracking-widest text-slate-500">Progress</p>
            {STEPS.map((step, i) => {
              const unlocked = isStepUnlocked(i);
              const done = stepStates[i].done;
              const active = activeStep === step.key;

              return (
                <button
                  key={step.key}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => unlocked && setActiveStep(step.key)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-left transition-all",
                    "flex items-center gap-3",
                    active
                      ? "border-indigo-500/30 bg-indigo-600/20"
                      : unlocked
                        ? "border-transparent hover:bg-slate-800/60"
                        : "cursor-not-allowed border-transparent opacity-40",
                  )}
                >
                  <div
                    className={cn(
                      "h-7 w-7 shrink-0 rounded-full text-xs font-bold",
                      "flex items-center justify-center transition-all",
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-indigo-600 text-white ring-2 ring-indigo-400/30 ring-offset-2 ring-offset-slate-950"
                          : unlocked
                            ? "bg-slate-700 text-slate-400"
                            : "bg-slate-800 text-slate-600",
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : !unlocked ? <Lock className="h-3 w-3" /> : i + 1}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate text-sm font-semibold",
                        active ? "text-white" : unlocked ? "text-slate-300" : "text-slate-600",
                      )}
                    >
                      {step.label}
                    </p>
                    {step.required.length > 0 && !done && (
                      <p className="mt-0.5 text-[10px] text-rose-400">Required</p>
                    )}
                    {done && <p className="mt-0.5 text-[10px] text-emerald-400">Complete</p>}
                  </div>
                </button>
              );
            })}

            <div className="absolute bottom-4 left-[1.85rem] top-[4.5rem] -z-10 w-px bg-slate-800" />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-white">
              {STEPS.find((s) => s.key === activeStep)?.label}
            </h1>
            <p className="mt-1 text-slate-400">{STEPS.find((s) => s.key === activeStep)?.description}</p>
          </div>

          <div className="space-y-6 rounded-2xl border border-white/5 bg-slate-900/60 p-6 shadow-lg">
            {activeStep === "identity" && (
              <IdentityStep
                form={form}
                setField={setField}
                resumeState={resumeState}
                resumeStatusText={resumeStatusText}
                onResumeUpload={handleResumeUpload}
                autofillVersion={autofillVersion}
              />
            )}
            {activeStep === "academics" && <AcademicsStep form={form} setField={setField} />}
            {activeStep === "skills" && (
              <SkillsStep form={form} setField={setField} autofillVersion={autofillVersion} />
            )}
            {activeStep === "projects" && <ProjectsStep form={form} setField={setField} />}
            {activeStep === "experience" && <ExperienceStep form={form} setField={setField} />}
            {activeStep === "extras" && <ExtrasStep form={form} setField={setField} />}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const prev = currentStepIndex - 1;
                if (prev >= 0) setActiveStep(STEPS[prev].key);
              }}
              disabled={currentStepIndex === 0}
              className="text-sm text-slate-400 transition-all hover:text-white disabled:opacity-0"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 md:hidden">
                {STEPS.map((s, i) => (
                  <div
                    key={s.key}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all",
                      i === currentStepIndex
                        ? "w-4 bg-indigo-400"
                        : stepStates[i].done
                          ? "bg-emerald-500"
                          : "bg-slate-700",
                    )}
                  />
                ))}
              </div>

              {currentStepIndex < STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={STEPS[currentStepIndex].required.length > 0 && !stepStates[currentStepIndex].done}
                  className="bg-indigo-600 px-6 font-bold text-white hover:bg-indigo-500"
                >
                  Continue to {STEPS[currentStepIndex + 1]?.label}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={!allRequired}
                  className="bg-emerald-600 px-6 font-bold text-white hover:bg-emerald-500"
                >
                  {allRequired ? "Go to Dashboard" : "Complete required fields first"}
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-slate-200">
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
        {!required && <span className="ml-1 text-xs text-slate-500">(optional)</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function IdentityStep({
  form,
  setField,
  resumeState,
  resumeStatusText,
  onResumeUpload,
  autofillVersion,
}: {
  form: ProfileForm;
  setField: <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => void;
  resumeState: string;
  resumeStatusText: string;
  onResumeUpload: (f: File) => void;
  autofillVersion: number;
}) {
  const autofillClass = autofillVersion > 0 ? "autofill-flash" : "";

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "rounded-xl border-2 border-dashed p-5 transition-all",
          resumeState === "done"
            ? "border-emerald-500/50 bg-emerald-500/5"
            : resumeState === "parsing"
              ? "border-indigo-500/50 bg-indigo-500/5"
              : "border-slate-700 hover:border-slate-600",
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              resumeState === "done" ? "bg-emerald-500/20" : "bg-slate-800",
            )}
          >
            {resumeState === "parsing" ? (
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            ) : resumeState === "done" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <Upload className="h-5 w-5 text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Upload Resume</p>
            <p className="mt-0.5 text-xs text-slate-400">
              PDF or DOCX, we autofill skills, projects, and experience automatically.
            </p>
            {resumeStatusText && (
              <p
                className={cn(
                  "mt-2 text-xs",
                  resumeState === "done"
                    ? "text-emerald-400"
                    : resumeState === "error"
                      ? "text-rose-400"
                      : "text-indigo-400",
                )}
              >
                {resumeStatusText}
              </p>
            )}
            {resumeState !== "parsing" && resumeState !== "done" && (
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="mt-3 cursor-pointer text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-600/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-400 hover:file:bg-indigo-600/30"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onResumeUpload(f);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-white/5 bg-slate-800/40 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Info (from Microsoft)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <p className="text-sm font-medium text-slate-200">Connected</p>
          </div>
        </div>
        <p className="text-xs text-slate-600">
          Name and email are synced from your university Microsoft account and are not editable here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="SAP ID" required hint="9-digit number, e.g. 500125613">
          <Input
            value={form.sapId}
            onChange={(e) => setField("sapId", e.target.value)}
            placeholder="500125613"
            maxLength={9}
            className={cn("border-slate-700 bg-slate-800 text-white", autofillClass)}
          />
        </FormField>
        <FormField label="Roll Number" required hint="R followed by 10 digits, e.g. R2142212345">
          <Input
            value={form.rollNo}
            onChange={(e) => setField("rollNo", e.target.value)}
            placeholder="R2142212345"
            className={cn("border-slate-700 bg-slate-800 text-white", autofillClass)}
          />
        </FormField>
        <FormField label="Phone">
          <Input
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="+91 98765 43210"
            className="border-slate-700 bg-slate-800 text-white"
          />
        </FormField>
        <FormField label="LinkedIn">
          <Input
            value={form.linkedin}
            onChange={(e) => setField("linkedin", e.target.value)}
            placeholder="linkedin.com/in/your-name"
            className="border-slate-700 bg-slate-800 text-white"
          />
        </FormField>
        <FormField label="Portfolio / GitHub" className="sm:col-span-2">
          <Input
            value={form.portfolio}
            onChange={(e) => setField("portfolio", e.target.value)}
            placeholder="github.com/your-username or yourportfolio.dev"
            className="border-slate-700 bg-slate-800 text-white"
          />
        </FormField>
      </div>
    </div>
  );
}

function AcademicsStep({
  form,
  setField,
}: {
  form: ProfileForm;
  setField: <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="CGPA" required hint="0.0 to 10.0">
          <Input
            type="number"
            min="0"
            max="10"
            step="0.01"
            value={form.cgpa}
            onChange={(e) => setField("cgpa", e.target.value)}
            placeholder="8.5"
            className="border-slate-700 bg-slate-800 text-white"
          />
        </FormField>

        <FormField label="Branch" required>
          <select
            value={form.branch}
            onChange={(e) => setField("branch", e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select branch</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Batch Year" required hint="Year of graduation">
          <select
            value={form.batchYear}
            onChange={(e) => setField("batchYear", e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select year</option>
            {BATCH_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Semester">
          <select
            value={form.semester}
            onChange={(e) => setField("semester", e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="10th %" required hint="Percentage (0 to 100)">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.tenthPercentage}
            onChange={(e) => setField("tenthPercentage", e.target.value)}
            placeholder="85.5"
            className="border-slate-700 bg-slate-800 text-white"
          />
        </FormField>

        <FormField label="12th %" required hint="Percentage (0 to 100)">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.twelfthPercentage}
            onChange={(e) => setField("twelfthPercentage", e.target.value)}
            placeholder="87.0"
            className="border-slate-700 bg-slate-800 text-white"
          />
        </FormField>
      </div>
    </div>
  );
}

function SkillsStep({
  form,
  setField,
  autofillVersion,
}: {
  form: ProfileForm;
  setField: <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => void;
  autofillVersion: number;
}) {
  return (
    <div className="space-y-6">
      <FormField label="Technical Skills" hint="Type and press Enter/comma. Resume autofill can populate this.">
        <TagInput
          key={autofillVersion}
          tags={form.skills}
          onChange={(tags) => setField("skills", tags)}
          placeholder="Python, React, Docker..."
          maxTags={40}
          className={autofillVersion > 0 ? "autofill-flash" : ""}
        />
      </FormField>
      <p className="text-xs text-slate-500">
        Skills are used directly for embeddings and ranking. Prefer specific skills like React.js, PostgreSQL, or
        TensorFlow.
      </p>
      <FormField label="Soft Skills" hint="Communication, leadership, teamwork...">
        <TagInput
          tags={form.softSkills}
          onChange={(tags) => setField("softSkills", tags)}
          placeholder="Communication, Leadership..."
        />
      </FormField>
    </div>
  );
}

function ProjectsStep({
  form,
  setField,
}: {
  form: ProfileForm;
  setField: <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => void;
}) {
  function addProject() {
    setField("projects", [
      ...form.projects,
      {
        id: uid(),
        title: "",
        description: "",
        techStack: [],
        githubUrl: "",
        startDate: "",
        endDate: "",
      },
    ]);
  }

  function updateProject(id: string, updates: Partial<Project>) {
    setField(
      "projects",
      form.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  }

  function removeProject(id: string) {
    setField(
      "projects",
      form.projects.filter((p) => p.id !== id),
    );
  }

  return (
    <div className="space-y-4">
      {form.projects.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
          <p className="text-sm text-slate-400">No projects yet. Add your best projects here.</p>
          <p className="mt-1 text-xs text-slate-600">
            Projects are optional but significantly improve ranking quality.
          </p>
        </div>
      )}

      {form.projects.map((p, idx) => (
        <div key={p.id} className="space-y-3 rounded-xl border border-white/5 bg-slate-800/30 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-slate-500">Project {idx + 1}</p>
            <button
              type="button"
              onClick={() => removeProject(p.id)}
              className="text-xs text-rose-400 hover:text-rose-300"
            >
              Remove
            </button>
          </div>
          <Input
            value={p.title}
            onChange={(e) => updateProject(p.id, { title: e.target.value })}
            placeholder="Project title"
            className="border-slate-700 bg-slate-800 text-white"
          />
          <Textarea
            value={p.description}
            onChange={(e) => updateProject(p.id, { description: e.target.value })}
            placeholder="Brief description of what you built and your role"
            rows={2}
            className="resize-none border-slate-700 bg-slate-800 text-sm text-white"
          />
          <TagInput
            tags={p.techStack}
            onChange={(tags) => updateProject(p.id, { techStack: tags })}
            placeholder="React, Node.js, PostgreSQL..."
          />
          <Input
            value={p.githubUrl}
            onChange={(e) => updateProject(p.id, { githubUrl: e.target.value })}
            placeholder="GitHub or live URL"
            className="border-slate-700 bg-slate-800 text-sm text-white"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addProject}
        className="w-full rounded-xl border border-dashed border-slate-700 py-3 text-sm text-slate-400 transition-all hover:border-indigo-500/50 hover:text-indigo-400"
      >
        + Add Project
      </button>
    </div>
  );
}

function ExperienceStep({
  form,
  setField,
}: {
  form: ProfileForm;
  setField: <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => void;
}) {
  function addExp() {
    setField("experience", [
      ...form.experience,
      {
        id: uid(),
        company: "",
        role: "",
        description: "",
        startDate: "",
        endDate: "",
        isPresent: false,
      },
    ]);
  }

  function updateExp(id: string, updates: Partial<Experience>) {
    setField(
      "experience",
      form.experience.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
  }

  function removeExp(id: string) {
    setField(
      "experience",
      form.experience.filter((e) => e.id !== id),
    );
  }

  return (
    <div className="space-y-4">
      {form.experience.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
          <p className="text-sm text-slate-400">No experience yet. Add internships, part-time, or freelance work.</p>
        </div>
      )}

      {form.experience.map((e, idx) => (
        <div key={e.id} className="space-y-3 rounded-xl border border-white/5 bg-slate-800/30 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-slate-500">Experience {idx + 1}</p>
            <button
              type="button"
              onClick={() => removeExp(e.id)}
              className="text-xs text-rose-400 hover:text-rose-300"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={e.company}
              onChange={(ev) => updateExp(e.id, { company: ev.target.value })}
              placeholder="Company name"
              className="border-slate-700 bg-slate-800 text-white"
            />
            <Input
              value={e.role}
              onChange={(ev) => updateExp(e.id, { role: ev.target.value })}
              placeholder="Role / Designation"
              className="border-slate-700 bg-slate-800 text-white"
            />
            <Input
              type="month"
              value={e.startDate}
              onChange={(ev) => updateExp(e.id, { startDate: ev.target.value })}
              className="border-slate-700 bg-slate-800 text-white"
            />
            {!e.isPresent && (
              <Input
                type="month"
                value={e.endDate}
                onChange={(ev) => updateExp(e.id, { endDate: ev.target.value })}
                className="border-slate-700 bg-slate-800 text-white"
              />
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={e.isPresent}
              onChange={(ev) => updateExp(e.id, { isPresent: ev.target.checked, endDate: "" })}
              className="rounded"
            />
            Currently working here
          </label>
          <Textarea
            value={e.description}
            onChange={(ev) => updateExp(e.id, { description: ev.target.value })}
            placeholder="What you did, technologies used, outcomes"
            rows={2}
            className="resize-none border-slate-700 bg-slate-800 text-sm text-white"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addExp}
        className="w-full rounded-xl border border-dashed border-slate-700 py-3 text-sm text-slate-400 transition-all hover:border-indigo-500/50 hover:text-indigo-400"
      >
        + Add Experience
      </button>
    </div>
  );
}

function ExtrasStep({
  form,
  setField,
}: {
  form: ProfileForm;
  setField: <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300">
          Certifications <span className="text-xs font-normal text-slate-500">(optional)</span>
        </h3>
        {form.certifications.map((c, i) => (
          <div key={c.id} className="grid grid-cols-3 items-center gap-2">
            <Input
              value={c.title}
              onChange={(e) =>
                setField(
                  "certifications",
                  form.certifications.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                )
              }
              placeholder="Certification name"
              className="border-slate-700 bg-slate-800 text-sm text-white"
            />
            <Input
              value={c.issuer}
              onChange={(e) =>
                setField(
                  "certifications",
                  form.certifications.map((x, j) => (j === i ? { ...x, issuer: e.target.value } : x)),
                )
              }
              placeholder="Issuer"
              className="border-slate-700 bg-slate-800 text-sm text-white"
            />
            <div className="flex gap-2">
              <Input
                value={c.year}
                onChange={(e) =>
                  setField(
                    "certifications",
                    form.certifications.map((x, j) => (j === i ? { ...x, year: e.target.value } : x)),
                  )
                }
                placeholder="Year"
                className="border-slate-700 bg-slate-800 text-sm text-white"
              />
              <button
                type="button"
                onClick={() =>
                  setField(
                    "certifications",
                    form.certifications.filter((_, j) => j !== i),
                  )
                }
                className="px-2 text-xs text-rose-400 hover:text-rose-300"
              >
                X
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setField("certifications", [
              ...form.certifications,
              { id: uid(), title: "", issuer: "", year: "" },
            ])
          }
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          + Add Certification
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300">
          Coding Profiles <span className="text-xs font-normal text-slate-500">(optional)</span>
        </h3>
        {form.codingProfiles.map((c, i) => (
          <div key={c.id} className="grid grid-cols-3 items-center gap-2">
            <select
              value={c.platform}
              onChange={(e) =>
                setField(
                  "codingProfiles",
                  form.codingProfiles.map((x, j) => (j === i ? { ...x, platform: e.target.value } : x)),
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              <option value="">Platform</option>
              {[
                "LeetCode",
                "CodeChef",
                "HackerRank",
                "GitHub",
                "Codeforces",
                "AtCoder",
              ].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Input
              value={c.username}
              onChange={(e) =>
                setField(
                  "codingProfiles",
                  form.codingProfiles.map((x, j) => (j === i ? { ...x, username: e.target.value } : x)),
                )
              }
              placeholder="Username"
              className="border-slate-700 bg-slate-800 text-sm text-white"
            />
            <div className="flex gap-2">
              <Input
                value={c.url}
                onChange={(e) =>
                  setField(
                    "codingProfiles",
                    form.codingProfiles.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                  )
                }
                placeholder="Profile URL"
                className="border-slate-700 bg-slate-800 text-sm text-white"
              />
              <button
                type="button"
                onClick={() =>
                  setField(
                    "codingProfiles",
                    form.codingProfiles.filter((_, j) => j !== i),
                  )
                }
                className="px-2 text-xs text-rose-400"
              >
                X
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setField("codingProfiles", [
              ...form.codingProfiles,
              { id: uid(), platform: "", username: "", url: "" },
            ])
          }
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          + Add Profile
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300">
          Research Papers <span className="text-xs font-normal text-slate-500">(optional)</span>
        </h3>
        {form.researchPapers.map((r, i) => (
          <div key={r.id} className="space-y-2 rounded-xl border border-white/5 bg-slate-800/20 p-3">
            <div className="flex gap-2">
              <Input
                value={r.title}
                onChange={(e) =>
                  setField(
                    "researchPapers",
                    form.researchPapers.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                  )
                }
                placeholder="Paper title"
                className="flex-1 border-slate-700 bg-slate-800 text-sm text-white"
              />
              <button
                type="button"
                onClick={() =>
                  setField(
                    "researchPapers",
                    form.researchPapers.filter((_, j) => j !== i),
                  )
                }
                className="px-2 text-xs text-rose-400"
              >
                X
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={r.journal}
                onChange={(e) =>
                  setField(
                    "researchPapers",
                    form.researchPapers.map((x, j) => (j === i ? { ...x, journal: e.target.value } : x)),
                  )
                }
                placeholder="Journal or Conference"
                className="border-slate-700 bg-slate-800 text-sm text-white"
              />
              <Input
                value={r.year}
                onChange={(e) =>
                  setField(
                    "researchPapers",
                    form.researchPapers.map((x, j) => (j === i ? { ...x, year: e.target.value } : x)),
                  )
                }
                placeholder="Year"
                className="border-slate-700 bg-slate-800 text-sm text-white"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setField("researchPapers", [
              ...form.researchPapers,
              { id: uid(), title: "", journal: "", year: "", url: "" },
            ])
          }
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          + Add Paper
        </button>
      </div>

      <div className="space-y-2">
        <FormField label="Achievements" hint="One achievement per line.">
          <Textarea
            value={form.achievements}
            onChange={(e) => setField("achievements", e.target.value)}
            rows={4}
            className="border-slate-700 bg-slate-800 text-sm text-white"
          />
        </FormField>
      </div>
    </div>
  );
}
