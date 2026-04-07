"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import ProfileView from "./profile-view";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentProfilePage() {
    const { user, student, isLoading } = useStudent();

    if (isLoading || !student || !user) {
        return (
            <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-48 w-full rounded-md" />
            </div>
        );
    }

    const serializedUser = {
        ...user,
        createdAt: user.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "",
        updatedAt: new Date().toISOString(),
    };

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <ProfileView user={serializedUser as any} profile={serializedProfile} />;
}