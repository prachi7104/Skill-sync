
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { requireStudentApiPolicyAccess, isOnboardingRequiredError } from "@/lib/auth/helpers";
import { eq } from "drizzle-orm";
import { computeCompleteness } from "@/lib/profile/completeness";
import { mapParsedResumeToProfile, type ParsedResumeData } from "@/lib/resume/ai-parser";
import { isRedirectError } from "next/dist/client/components/redirect";

interface MergeSectionRequest {
    mode?: "merge" | "replace";
    sections: {
        skills?: boolean;
        projects?: boolean;
        workExperience?: boolean;
        certifications?: boolean;
        codingProfiles?: boolean;
        researchPapers?: boolean;
        achievements?: boolean;
        softSkills?: boolean;
        contact?: boolean;
        academics?: boolean;
    };
}

function norm(value: string | null | undefined): string {
    return (value ?? "").trim().toLowerCase();
}

function uniqueByKey<T>(items: T[], getKey: (item: T) => string): T[] {
    const seen = new Set<string>();
    const result: T[] = [];

    for (const item of items) {
        const key = getKey(item);
        if (!key) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(item);
    }

    return result;
}

function mergeKeepExistingFirst<T>(
    existing: T[],
    incoming: T[],
    getKey: (item: T) => string,
): T[] {
    return uniqueByKey([...existing, ...incoming], getKey);
}

export async function POST(req: NextRequest) {
    try {
        const { user, profile } = await requireStudentApiPolicyAccess("/api/student/profile/merge");

        const body = await req.json() as MergeSectionRequest;
        const mode = body.mode === "replace" ? "replace" : "merge";
        const sections = body.sections ?? {};

        const selected = {
            skills: sections.skills ?? true,
            projects: sections.projects ?? true,
            workExperience: sections.workExperience ?? true,
            certifications: sections.certifications ?? true,
            codingProfiles: sections.codingProfiles ?? true,
            researchPapers: sections.researchPapers ?? true,
            achievements: sections.achievements ?? true,
            softSkills: sections.softSkills ?? true,
            contact: sections.contact ?? false,
            academics: sections.academics ?? false,
        };

        if (!Object.values(selected).some(Boolean)) {
            return NextResponse.json(
                { message: "No sections selected" },
                { status: 400 },
            );
        }

        if (!profile.parsedResumeJson) {
            return NextResponse.json(
                { message: "No parsed resume data found" },
                { status: 400 }
            );
        }

        const parsedData = profile.parsedResumeJson as ParsedResumeData;
        const mapped = mapParsedResumeToProfile(parsedData);
        const updates: Record<string, unknown> = {};

        const existingSkills = Array.isArray(profile.skills) ? profile.skills : [];
        const existingProjects = Array.isArray(profile.projects) ? profile.projects : [];
        const existingWork = Array.isArray(profile.workExperience) ? profile.workExperience : [];
        const existingCerts = Array.isArray(profile.certifications) ? profile.certifications : [];
        const existingCoding = Array.isArray(profile.codingProfiles) ? profile.codingProfiles : [];
        const existingResearch = Array.isArray(profile.researchPapers) ? profile.researchPapers : [];
        const existingAchievements = Array.isArray(profile.achievements) ? profile.achievements : [];
        const existingSoftSkills = Array.isArray(profile.softSkills) ? profile.softSkills : [];

        if (selected.skills) {
            updates.skills =
                mode === "replace"
                    ? mapped.skills
                    : mergeKeepExistingFirst(existingSkills, mapped.skills, (s: any) => norm(s?.name));
        }

        if (selected.projects) {
            updates.projects =
                mode === "replace"
                    ? mapped.projects
                    : mergeKeepExistingFirst(existingProjects, mapped.projects, (p: any) => `${norm(p?.title)}|${norm(p?.description)}`);
        }

        if (selected.workExperience) {
            updates.workExperience =
                mode === "replace"
                    ? mapped.workExperience
                    : mergeKeepExistingFirst(
                        existingWork,
                        mapped.workExperience,
                        (w: any) => `${norm(w?.company)}|${norm(w?.role)}|${norm(w?.startDate)}`,
                    );
        }

        if (selected.certifications) {
            updates.certifications =
                mode === "replace"
                    ? mapped.certifications
                    : mergeKeepExistingFirst(
                        existingCerts,
                        mapped.certifications,
                        (c: any) => `${norm(c?.title)}|${norm(c?.issuer)}`,
                    );
        }

        if (selected.codingProfiles) {
            updates.codingProfiles =
                mode === "replace"
                    ? mapped.codingProfiles
                    : mergeKeepExistingFirst(
                        existingCoding,
                        mapped.codingProfiles,
                        (c: any) => `${norm(c?.platform)}|${norm(c?.username)}|${norm(c?.url)}`,
                    );
        }

        if (selected.researchPapers) {
            updates.researchPapers =
                mode === "replace"
                    ? mapped.researchPapers
                    : mergeKeepExistingFirst(existingResearch, mapped.researchPapers, (r: any) => norm(r?.title));
        }

        if (selected.achievements) {
            updates.achievements =
                mode === "replace"
                    ? mapped.achievements
                    : mergeKeepExistingFirst(
                        existingAchievements,
                        mapped.achievements,
                        (a: any) => `${norm(a?.title)}|${norm(a?.issuer)}`,
                    );
        }

        if (selected.softSkills) {
            updates.softSkills =
                mode === "replace"
                    ? uniqueByKey(mapped.softSkills, (s) => norm(s))
                    : uniqueByKey([...existingSoftSkills, ...mapped.softSkills], (s) => norm(String(s)));
        }

        if (selected.contact) {
            if (mode === "replace") {
                updates.phone = mapped.phone;
                updates.linkedin = mapped.linkedin;
            } else {
                if (!profile.phone && mapped.phone) updates.phone = mapped.phone;
                if (!profile.linkedin && mapped.linkedin) updates.linkedin = mapped.linkedin;
            }
        }

        if (selected.academics) {
            if (mode === "replace") {
                updates.tenthPercentage = mapped.tenthPercentage;
                updates.twelfthPercentage = mapped.twelfthPercentage;
                updates.cgpa = mapped.cgpa;
            } else {
                if ((profile.tenthPercentage ?? null) === null && mapped.tenthPercentage !== null) {
                    updates.tenthPercentage = mapped.tenthPercentage;
                }
                if ((profile.twelfthPercentage ?? null) === null && mapped.twelfthPercentage !== null) {
                    updates.twelfthPercentage = mapped.twelfthPercentage;
                }
                if ((profile.cgpa ?? null) === null && mapped.cgpa !== null) {
                    updates.cgpa = mapped.cgpa;
                }
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({
                message: "No changes applied",
                mode,
            });
        }

        const updatedProfileState = {
            ...profile,
            ...updates,
            name: user.name,
            email: user.email,
        };
        const { score } = computeCompleteness(updatedProfileState);

        await db
            .update(students)
            .set({
                ...updates,
                profileCompleteness: score,
                updatedAt: new Date(),
            })
            .where(eq(students.id, user.id));

        return NextResponse.json({
            message: mode === "replace" ? "Profile replaced from latest resume" : "Profile merged with latest resume",
            mode,
            updatedFields: Object.keys(updates),
        });

    } catch (error) {
        if (isRedirectError(error)) throw error;
        if (isOnboardingRequiredError(error)) {
            return NextResponse.json(
                { message: error.message, code: "ONBOARDING_REQUIRED" },
                { status: error.status },
            );
        }
        console.error("Merge failed:", error);
        return NextResponse.json(
            { message: "Internal server error during merge" },
            { status: 500 }
        );
    }
}
