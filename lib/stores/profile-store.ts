"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Project,
  WorkExperience,
  Skill,
  Certification,
  CodingProfile,
  ResearchPaper,
  Achievement,
} from "@/lib/db/schema";

// ─────────────────────────────────────────────────────────────────────────────
// Profile State Interface
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileState {
  // ── Resume ──────────────────────────────────────────────────────────────
  resumeUrl: string | null;

  // ── Identity ────────────────────────────────────────────────────────────
  name: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  sapId: string;
  rollNo: string;

  // ── Academics ───────────────────────────────────────────────────────────
  tenthPercentage: number | null;
  twelfthPercentage: number | null;
  cgpa: number | null;
  semester: number | null;
  branch: string;
  batchYear: number | null;
  category: "alpha" | "beta" | "gamma" | null;

  // ── Profile Sections ────────────────────────────────────────────────────
  projects: Project[];
  workExperience: WorkExperience[];
  skills: Skill[];
  certifications: Certification[];
  codingProfiles: CodingProfile[];
  researchPapers: ResearchPaper[];
  achievements: Achievement[];
  softSkills: string[];

  // ── Navigation ──────────────────────────────────────────────────────────
  currentStep: number;

  // ── Actions ─────────────────────────────────────────────────────────────
  setResumeUrl: (url: string | null) => void;
  updateIdentity: (data: Partial<Pick<ProfileState, "name" | "email" | "phone" | "linkedinUrl" | "sapId" | "rollNo">>) => void;
  updateAcademics: (data: Partial<Pick<ProfileState, "tenthPercentage" | "twelfthPercentage" | "cgpa" | "semester" | "branch" | "batchYear" | "category">>) => void;

  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (index: number) => void;

  setWorkExperience: (work: WorkExperience[]) => void;
  addWorkExperience: (exp: WorkExperience) => void;
  removeWorkExperience: (index: number) => void;

  setSkills: (skills: Skill[]) => void;
  addSkill: (skill: Skill) => void;
  removeSkill: (index: number) => void;

  setCertifications: (certs: Certification[]) => void;
  addCertification: (cert: Certification) => void;
  removeCertification: (index: number) => void;

  setCodingProfiles: (profiles: CodingProfile[]) => void;
  addCodingProfile: (profile: CodingProfile) => void;
  removeCodingProfile: (index: number) => void;

  setSoftSkills: (skills: string[]) => void;

  setAchievements: (achievements: Achievement[]) => void;
  addAchievement: (achievement: Achievement) => void;
  removeAchievement: (index: number) => void;

  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
  loadFromDB: (data: Record<string, unknown>) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  resumeUrl: null,
  name: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  sapId: "",
  rollNo: "",
  tenthPercentage: null,
  twelfthPercentage: null,
  cgpa: null,
  semester: null,
  branch: "",
  batchYear: null,
  category: null as "alpha" | "beta" | "gamma" | null,
  projects: [] as Project[],
  workExperience: [] as WorkExperience[],
  skills: [] as Skill[],
  certifications: [] as Certification[],
  codingProfiles: [] as CodingProfile[],
  researchPapers: [] as ResearchPaper[],
  achievements: [] as Achievement[],
  softSkills: [] as string[],
  currentStep: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      // ── Resume ──────────────────────────────────────────────────────────
      setResumeUrl: (url) => set({ resumeUrl: url }),

      // ── Identity ────────────────────────────────────────────────────────
      updateIdentity: (data) => set(data),

      // ── Academics ───────────────────────────────────────────────────────
      updateAcademics: (data) => set(data),

      // ── Projects ────────────────────────────────────────────────────────
      setProjects: (projects) => set({ projects }),
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      removeProject: (index) =>
        set((state) => ({
          projects: state.projects.filter((_, i) => i !== index),
        })),

      // ── Work Experience ─────────────────────────────────────────────────
      setWorkExperience: (work) => set({ workExperience: work }),
      addWorkExperience: (exp) =>
        set((state) => ({
          workExperience: [...state.workExperience, exp],
        })),
      removeWorkExperience: (index) =>
        set((state) => ({
          workExperience: state.workExperience.filter((_, i) => i !== index),
        })),

      // ── Skills ──────────────────────────────────────────────────────────
      setSkills: (skills) => set({ skills }),
      addSkill: (skill) =>
        set((state) => ({ skills: [...state.skills, skill] })),
      removeSkill: (index) =>
        set((state) => ({
          skills: state.skills.filter((_, i) => i !== index),
        })),

      // ── Certifications ──────────────────────────────────────────────────
      setCertifications: (certs) => set({ certifications: certs }),
      addCertification: (cert) =>
        set((state) => ({
          certifications: [...state.certifications, cert],
        })),
      removeCertification: (index) =>
        set((state) => ({
          certifications: state.certifications.filter((_, i) => i !== index),
        })),

      // ── Coding Profiles ─────────────────────────────────────────────────
      setCodingProfiles: (profiles) => set({ codingProfiles: profiles }),
      addCodingProfile: (profile) =>
        set((state) => ({
          codingProfiles: [...state.codingProfiles, profile],
        })),
      removeCodingProfile: (index) =>
        set((state) => ({
          codingProfiles: state.codingProfiles.filter((_, i) => i !== index),
        })),

      // ── Soft Skills ─────────────────────────────────────────────────────
      setSoftSkills: (skills) => set({ softSkills: skills }),

      // ── Achievements ────────────────────────────────────────────────────
      setAchievements: (achievements) => set({ achievements }),
      addAchievement: (achievement) =>
        set((state) => ({
          achievements: [...state.achievements, achievement],
        })),
      removeAchievement: (index) =>
        set((state) => ({
          achievements: state.achievements.filter((_, i) => i !== index),
        })),

      // ── Navigation ──────────────────────────────────────────────────────
      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 8),
        })),
      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),
      goToStep: (step) => set({ currentStep: step }),

      // ── Reset ───────────────────────────────────────────────────────────
      reset: () => set(INITIAL_STATE),

      // ── Load from DB ────────────────────────────────────────────────────
      loadFromDB: (data: Record<string, unknown>) =>
        set({
          name: (data.name as string) || "",
          email: (data.email as string) || "",
          phone: (data.phone as string) || "",
          linkedinUrl: (data.linkedin as string) || "",
          sapId: (data.sapId as string) || "",
          rollNo: (data.rollNo as string) || "",
          tenthPercentage: (data.tenthPercentage as number) ?? null,
          twelfthPercentage: (data.twelfthPercentage as number) ?? null,
          cgpa: (data.cgpa as number) ?? null,
          semester: (data.semester as number) ?? null,
          branch: (data.branch as string) || "",
          batchYear: (data.batchYear as number) ?? null,
          category: (data.category as "alpha" | "beta" | "gamma") ?? null,
          projects: (data.projects as Project[]) || [],
          workExperience: (data.workExperience as WorkExperience[]) || [],
          skills: (data.skills as Skill[]) || [],
          certifications: (data.certifications as Certification[]) || [],
          codingProfiles: (data.codingProfiles as CodingProfile[]) || [],
          researchPapers: (data.researchPapers as ResearchPaper[]) || [],
          achievements: (data.achievements as Achievement[]) || [],
          softSkills: (data.softSkills as string[]) || [],
          resumeUrl: (data.resumeUrl as string) || null,
          currentStep: (data.onboardingStep as number) || 0,
        }),
    }),
    {
      name: "profile-storage",
      // Don't persist File objects — they can't be serialized
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ...rest } = state;
        return rest;
      },
    }
  )
);
