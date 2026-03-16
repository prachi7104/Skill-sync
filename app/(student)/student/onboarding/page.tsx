"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStudent } from "@/app/(student)/providers/student-provider";

type TabKey = "personal" | "academics" | "skills" | "projects" | "experience" | "extras";

type ProfileForm = {
  sapId: string;
  rollNo: string;
  phone: string;
  linkedin: string;
  cgpa: string;
  branch: string;
  batchYear: string;
  semester: string;
  tenthPercentage: string;
  twelfthPercentage: string;
  skillsCsv: string;
  projectsText: string;
  workText: string;
  certificationsText: string;
  codingProfilesText: string;
  softSkillsCsv: string;
};

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "personal", label: "Personal" },
  { key: "academics", label: "Academics" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Projects" },
  { key: "experience", label: "Experience" },
  { key: "extras", label: "Extras" },
];

function toCsv(items: string[] | null | undefined): string {
  if (!items || items.length === 0) return "";
  return items.join(", ");
}

function toFormFromStudent(student: any): ProfileForm {
  return {
    sapId: student?.sapId ?? "",
    rollNo: student?.rollNo ?? "",
    phone: student?.phone ?? "",
    linkedin: student?.linkedin ?? "",
    cgpa: student?.cgpa?.toString() ?? "",
    branch: student?.branch ?? "",
    batchYear: student?.batchYear?.toString() ?? "",
    semester: student?.semester?.toString() ?? "",
    tenthPercentage: student?.tenthPercentage?.toString() ?? "",
    twelfthPercentage: student?.twelfthPercentage?.toString() ?? "",
    skillsCsv: (student?.skills ?? []).map((s: { name: string }) => s.name).join(", "),
    projectsText: (student?.projects ?? [])
      .map((p: { title: string; description?: string; techStack?: string[] }) => `${p.title}|${p.description ?? ""}|${(p.techStack ?? []).join(",")}`)
      .join("\n"),
    workText: (student?.workExperience ?? [])
      .map((w: { company: string; role: string; description?: string; startDate?: string; endDate?: string }) => `${w.company}|${w.role}|${w.description ?? ""}|${w.startDate ?? ""}|${w.endDate ?? ""}`)
      .join("\n"),
    certificationsText: (student?.certifications ?? [])
      .map((c: { title: string; issuer: string }) => `${c.title}|${c.issuer}`)
      .join("\n"),
    codingProfilesText: (student?.codingProfiles ?? [])
      .map((c: { platform: string; username: string; url: string }) => `${c.platform}|${c.username}|${c.url}`)
      .join("\n"),
    softSkillsCsv: toCsv(student?.softSkills),
  };
}

function parseList(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPatch(tab: TabKey, form: ProfileForm): Record<string, unknown> {
  if (tab === "personal") {
    return {
      sapId: form.sapId || undefined,
      rollNo: form.rollNo || undefined,
      phone: form.phone || undefined,
      linkedin: form.linkedin || undefined,
    };
  }

  if (tab === "academics") {
    return {
      cgpa: form.cgpa ? Number(form.cgpa) : null,
      branch: form.branch || null,
      batchYear: form.batchYear ? Number(form.batchYear) : null,
      semester: form.semester ? Number(form.semester) : null,
      tenthPercentage: form.tenthPercentage ? Number(form.tenthPercentage) : null,
      twelfthPercentage: form.twelfthPercentage ? Number(form.twelfthPercentage) : null,
    };
  }

  if (tab === "skills") {
    return {
      skills: parseList(form.skillsCsv).map((name) => ({ name, proficiency: 3 })),
    };
  }

  if (tab === "projects") {
    return {
      projects: form.projectsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [title, description = "", techStackRaw = ""] = line.split("|");
          return {
            title: title.trim(),
            description: description.trim(),
            techStack: parseList(techStackRaw),
          };
        }),
    };
  }

  if (tab === "experience") {
    return {
      workExperience: form.workText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [company, role, description = "", startDate = "", endDate = ""] = line.split("|");
          return {
            company: company.trim(),
            role: role.trim(),
            description: description.trim(),
            startDate: startDate.trim(),
            endDate: endDate.trim() || undefined,
          };
        }),
    };
  }

  return {
    certifications: form.certificationsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, issuer] = line.split("|");
        return { title: (title ?? "").trim(), issuer: (issuer ?? "").trim() };
      }),
    codingProfiles: form.codingProfilesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [platform, username, url] = line.split("|");
        return {
          platform: (platform ?? "").trim(),
          username: (username ?? "").trim(),
          url: (url ?? "").trim(),
        };
      }),
    softSkills: parseList(form.softSkillsCsv),
  };
}

export default function StudentOnboardingPage() {
  const { student, isLoading, refresh } = useStudent();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("personal");
  const [form, setForm] = useState<ProfileForm>(() => toFormFromStudent(student));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [completeness, setCompleteness] = useState(0);
  const [requiredCompleted, setRequiredCompleted] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [resumeStatus, setResumeStatus] = useState<string>("");
  const pollDeadlineRef = useRef<number>(0);

  useEffect(() => {
    setForm(toFormFromStudent(student));
  }, [student]);

  useEffect(() => {
    async function fetchCompleteness() {
      const res = await fetch("/api/student/profile/completeness");
      if (!res.ok) return;
      const json = await res.json();
      const payload = json?.data;
      setCompleteness(payload?.score ?? 0);
      setRequiredCompleted(Boolean(payload?.requiredCompleted));
    }

    if (!isLoading && student) {
      fetchCompleteness().catch(() => undefined);
    }
  }, [student, isLoading]);

  useEffect(() => {
    if (isLoading || !student) return;

    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        const patch = buildPatch(activeTab, form);
        const res = await fetch("/api/student/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });

        if (!res.ok) throw new Error("save-failed");
        setSaveState("saved");
        await refresh();

        const c = await fetch("/api/student/profile/completeness");
        if (c.ok) {
          const json = await c.json();
          setCompleteness(json?.data?.score ?? 0);
          setRequiredCompleted(Boolean(json?.data?.requiredCompleted));
        }
      } catch {
        setSaveState("error");
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [activeTab, form, isLoading, student, refresh]);

  async function onResumeUpload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("source", "onboarding");

    setResumeBusy(true);
    setResumeStatus("Uploading resume...");

    const upload = await fetch("/api/student/resume", {
      method: "POST",
      body: fd,
    });

    if (!upload.ok) {
      setResumeBusy(false);
      setResumeStatus("Upload failed");
      return;
    }

    setResumeStatus("Parsing resume and auto-filling profile...");
    pollDeadlineRef.current = Date.now() + 3 * 60 * 1000;

    const poll = window.setInterval(async () => {
      if (Date.now() > pollDeadlineRef.current) {
        setResumeBusy(false);
        setResumeStatus("Parsing is taking longer than expected. Continue filling manually.");
        clearInterval(poll);
        return;
      }

      const res = await fetch("/api/student/profile");
      if (!res.ok) return;

      const data = await res.json();
      const parsed = data?.data?.profile?.resumeParsedAt;
      if (parsed) {
        clearInterval(poll);
        setResumeBusy(false);
        setResumeStatus("Resume parsed. Autofill applied.");
        await refresh();
      }
    }, 5000);
  }

  const headerStatus = useMemo(() => {
    if (saveState === "saving") return "Saving...";
    if (saveState === "saved") return "Saved";
    if (saveState === "error") return "Save failed";
    return "";
  }, [saveState]);

  if (isLoading || !student) {
    return <div className="p-8 text-sm text-slate-400">Loading onboarding...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Complete Your Onboarding</h1>
            <p className="text-sm text-slate-400">All tabs auto-save. Fill the required fields to unlock dashboard.</p>
          </div>
          <div className="text-sm text-slate-300">Profile completeness: <span className="font-semibold text-white">{completeness}%</span></div>
        </div>
        {headerStatus ? <p className="mt-2 text-xs text-slate-400">{headerStatus}</p> : null}
        {resumeStatus ? <p className="mt-2 text-xs text-indigo-300">{resumeStatus}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm ${activeTab === tab.key ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-300"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{TABS.find((t) => t.key === activeTab)?.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === "personal" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>SAP ID</Label>
                <Input value={form.sapId} onChange={(e) => setForm((p) => ({ ...p, sapId: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Roll No</Label>
                <Input value={form.rollNo} onChange={(e) => setForm((p) => ({ ...p, rollNo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input value={form.linkedin} onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Resume Upload</Label>
                <Input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  disabled={resumeBusy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onResumeUpload(file).catch(() => undefined);
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === "academics" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2"><Label>CGPA</Label><Input value={form.cgpa} onChange={(e) => setForm((p) => ({ ...p, cgpa: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Branch</Label><Input value={form.branch} onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Batch Year</Label><Input value={form.batchYear} onChange={(e) => setForm((p) => ({ ...p, batchYear: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Semester</Label><Input value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} /></div>
              <div className="space-y-2"><Label>10th %</Label><Input value={form.tenthPercentage} onChange={(e) => setForm((p) => ({ ...p, tenthPercentage: e.target.value }))} /></div>
              <div className="space-y-2"><Label>12th %</Label><Input value={form.twelfthPercentage} onChange={(e) => setForm((p) => ({ ...p, twelfthPercentage: e.target.value }))} /></div>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-2">
              <Label>Skills (comma separated)</Label>
              <Textarea value={form.skillsCsv} onChange={(e) => setForm((p) => ({ ...p, skillsCsv: e.target.value }))} rows={6} />
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-2">
              <Label>Projects (one per line: title|description|tech1,tech2)</Label>
              <Textarea value={form.projectsText} onChange={(e) => setForm((p) => ({ ...p, projectsText: e.target.value }))} rows={8} />
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-2">
              <Label>Experience (one per line: company|role|description|start YYYY-MM|end YYYY-MM)</Label>
              <Textarea value={form.workText} onChange={(e) => setForm((p) => ({ ...p, workText: e.target.value }))} rows={8} />
            </div>
          )}

          {activeTab === "extras" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Certifications (one per line: title|issuer)</Label>
                <Textarea value={form.certificationsText} onChange={(e) => setForm((p) => ({ ...p, certificationsText: e.target.value }))} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Coding Profiles (one per line: platform|username|url)</Label>
                <Textarea value={form.codingProfilesText} onChange={(e) => setForm((p) => ({ ...p, codingProfilesText: e.target.value }))} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Soft Skills (comma separated)</Label>
                <Textarea value={form.softSkillsCsv} onChange={(e) => setForm((p) => ({ ...p, softSkillsCsv: e.target.value }))} rows={3} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 p-4">
        <div className="text-sm text-slate-300">
          {requiredCompleted ? "Required fields complete. Dashboard is unlocked." : "Complete required fields to continue to dashboard."}
        </div>
        <Button disabled={!requiredCompleted} onClick={() => router.push("/student/dashboard")}>Continue to Dashboard</Button>
      </div>
    </div>
  );
}
