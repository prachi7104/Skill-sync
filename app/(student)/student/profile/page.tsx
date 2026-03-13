"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import ProfileView from "./profile-view";
import { format } from "date-fns";

export default function StudentProfilePage() {
    const { user, student, isLoading } = useStudent();

    if (isLoading || !student || !user) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const serializedUser = {
        ...user,
        createdAt: user.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "",
        updatedAt: new Date().toISOString(),
    };

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

    return <ProfileView user={serializedUser as any} profile={serializedProfile} />;
}