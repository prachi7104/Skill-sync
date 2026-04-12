"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import ProfileView from "./profile-view";
import { format } from "date-fns";

export default function StudentProfilePage() {
    const { user, student, isLoading } = useStudent();

    if (isLoading || !student || !user) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary/30" aria-hidden="true"></div>
                <span className="sr-only">Loading…</span>
            </div>
        );
    }

    // Ensure all array fields default to empty arrays so map() doesn't crash
    const serializedProfile = {
        ...student,
        createdAt: new Date(student.createdAt).toISOString(),
        updatedAt: new Date(student.updatedAt).toISOString(),
        resumeUploadedAt: student.resumeUploadedAt ? format(new Date(student.resumeUploadedAt), "MMM d, yyyy") : null,
        projects: student.projects || [],
        workExperience: student.workExperience || [],
        skills: student.skills || [],
        certifications: student.certifications || [],
        codingProfiles: student.codingProfiles || [],
        researchPapers: student.researchPapers || [],
        achievements: student.achievements || [],
        softSkills: student.softSkills || [],
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ProfileView
                user={{ name: user.name ?? "", email: user.email ?? "" }}
                profile={serializedProfile}
            />
        </div>
    );
}