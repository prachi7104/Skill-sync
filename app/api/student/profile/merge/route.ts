
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { eq } from "drizzle-orm";
import { computeCompleteness } from "@/lib/profile/completeness";
import { isRedirectError } from "next/dist/client/components/redirect";

interface MergeSectionRequest {
    sections: {
        skills?: boolean;
        projects?: boolean;
        workExperience?: boolean;
    };
}

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const { user, profile } = await requireStudentProfile();

        // 2. Parse payload
        const body = await req.json() as MergeSectionRequest;
        const { sections } = body;

        if (!profile.parsedResumeJson) {
            return NextResponse.json(
                { message: "No parsed resume data found" },
                { status: 400 }
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedData = profile.parsedResumeJson as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = {};

        // 3. Merge Logic

        // --- SKILLS ---
        if (sections.skills && Array.isArray(parsedData.skills)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const existingSkills = (profile.skills || []) as any[];
            const newSkills = parsedData.skills as string[];

            const mergedSkills = [...existingSkills];

            newSkills.forEach(newSkillName => {
                // Check for duplicates (case-insensitive)
                const exists = existingSkills.some(s => s.name.toLowerCase() === newSkillName.toLowerCase());

                if (!exists) {
                    mergedSkills.push({
                        name: newSkillName,
                        proficiency: 1, // Default to beginner/unrated
                    });
                }
            });
            updates.skills = mergedSkills;
        }

        // --- PROJECTS ---
        if (sections.projects && Array.isArray(parsedData.projects)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const existingProjects = (profile.projects || []) as any[];
            const newProjectLines = parsedData.projects as string[];

            const mergedProjects = [...existingProjects];

            newProjectLines.forEach(line => {
                // Simple deduplication attempt: check if title/desc contains this line
                // Since parsed data is unstructured "line", we treat it as a Description for a valid new project entry
                // We leave Title as a placeholder for the student to fix.
                const exists = existingProjects.some(p =>
                    p.description?.includes(line) || p.title?.includes(line)
                );

                if (!exists && line.length > 5) {
                    mergedProjects.push({
                        title: "Resume Project Entry", // Placeholder
                        description: line,
                        techStack: [],
                    });
                }
            });
            updates.projects = mergedProjects;
        }

        // --- WORK EXPERIENCE ---
        if (sections.workExperience && Array.isArray(parsedData.workExperience)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const existingWork = (profile.workExperience || []) as any[];
            const newWorkLines = parsedData.workExperience as string[];

            const mergedWork = [...existingWork];

            newWorkLines.forEach(line => {
                const exists = existingWork.some(w =>
                    w.description?.includes(line) || w.role?.includes(line) || w.company?.includes(line)
                );

                if (!exists && line.length > 5) {
                    mergedWork.push({
                        role: "Resume Work Entry", // Placeholder
                        company: "See Description",
                        startDate: new Date().toISOString().split('T')[0].slice(0, 7), // YYYY-MM
                        description: line,
                    });
                }
            });
            updates.workExperience = mergedWork;
        }

        // 4. Update DB
        if (Object.keys(updates).length > 0) {

            // Recompute Score
            // Merge the updates into the current profile snapshot to get the "new" state
            const updatedProfileState = {
                ...profile,
                ...updates
            };
            const { score } = computeCompleteness(updatedProfileState);

            await db.update(students)
                .set({
                    ...updates,
                    profileCompleteness: score
                })
                .where(eq(students.id, user.id));

            return NextResponse.json({
                message: "Profile updated successfully",
                updates
            });
        } else {
            return NextResponse.json({
                message: "No changes applied (no new data or no sections selected)",
            });
        }

    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Merge failed:", error);
        return NextResponse.json(
            { message: "Internal server error during merge" },
            { status: 500 }
        );
    }
}
