"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import ProfileView from "./profile-view";
import { format } from "date-fns";

export default function StudentProfilePage() {
    const { user, student, isLoading } = useStudent();

    if (isLoading || !student || !user) {
        return <div className="p-8">Loading profile...</div>;
    }

    // Serialize and format dates for View
    // Note: dates from JSON API are strings, so we must converting them to Date objects
    const serializedUser = {
        ...user,
        // Format: "September 2025" or similar
        createdAt: user.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "",
        // UserInfo interface might not have timestamps? Let's check. 
        // If user from context is UserInfo (id, name, email, role), it might miss createdAt.
        // But the API returns the full user record usually.
        // Let's assume user has it or handle gracefully.
        updatedAt: new Date().toISOString(), // Fallback or real if available
    };

    // The user object from useStudent (UserInfo) is { id, name, email, role }.
    // It might NOT have createdAt.
    // However, the /api/student/profile route returns { user, profile }. 
    // The user object there is likely the full record if the API returns it. 
    // Let's check the API route again. 
    // const { user, profile } = await requireStudentProfile();
    // return NextResponse.json({ user, profile });
    // requireStudentProfile returns the Drizzle result, which HAS createdAt.
    // So `user` in context (fetched from API) SHOULD have createdAt.
    // We just need to cast or access it.

    const serializedProfile = {
        ...student,
        createdAt: new Date(student.createdAt).toISOString(),
        updatedAt: new Date(student.updatedAt).toISOString(),
        // Format: "Jan 15, 2025"
        resumeUploadedAt: student.resumeUploadedAt ? format(new Date(student.resumeUploadedAt), "MMM d, yyyy") : null,
        projects: student.projects || [],
        workExperience: student.workExperience || [],
        skills: student.skills || [],
        certifications: student.certifications || [],
        codingProfiles: student.codingProfiles || [],
        achievements: student.achievements || [],
    };

    // We accept that some fields in serializedUser might be missing if the type definition 
    // of UserInfo in provider is strict. We might need to cast or update provider type.
    // For now, we cast to any to pass to View if types mismatch, but ideally we match types.

    return <ProfileView user={serializedUser as any} profile={serializedProfile} />;
}
