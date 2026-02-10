"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { type InferSelectModel } from "drizzle-orm";
import { type students } from "@/lib/db/schema";
import { toast } from "sonner";

// Type definition for the student profile from Drizzle
type Student = InferSelectModel<typeof students>;

// extended user type (basic info usually available from session/auth)
interface UserInfo {
    id: string;
    name: string;
    email: string;
    role: "student" | "faculty" | "admin";
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

interface StudentContextType {
    student: Student | null;
    user: UserInfo | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({
    children,
    initialStudent = null,
    initialUser = null
}: {
    children: ReactNode;
    initialStudent?: Student | null;
    initialUser?: UserInfo | null;
}) {
    const [student, setStudent] = useState<Student | null>(initialStudent);
    const [user, setUser] = useState<UserInfo | null>(initialUser);
    // If we have initial data, we aren't loading
    const [isLoading, setIsLoading] = useState(!initialStudent);
    const [error, setError] = useState<string | null>(null);

    const fetchStudentData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // We use the existing profile API which returns { user, profile }
            // This assumes GET /api/student/profile returns standard generic response
            // or specifically the user+profile object. 
            // Based on typical patterns in this codebase, let's assume standard fetch.
            const response = await fetch("/api/student/profile");

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Unauthorized");
                }
                throw new Error("Failed to fetch student profile");
            }

            const data = await response.json();

            // The API route usually returns { user, profile } based on requireStudentProfile()
            // Let's handle generic "data.profile" or just "data" depending on structure.
            // Adjusting to typical response: { user: ..., profile: ... }
            if (data.profile) {
                setStudent(data.profile);
            } else {
                // If the root object is the profile
                setStudent(data);
            }

            if (data.user) {
                setUser(data.user);
            }

        } catch (err) {
            console.error("Error fetching student context:", err);
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
            // Optional: don't toast on 401/initial load to avoid spamming login screen
            if (message !== "Unauthorized") {
                toast.error("Could not load student profile");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch only if no initial data or if explicitly requested (refresh)
    // We skip the effect if initialStudent is provided to avoid double-fetch
    useEffect(() => {
        if (!initialStudent) {
            fetchStudentData();
        }
    }, [fetchStudentData, initialStudent]);

    return (
        <StudentContext.Provider
            value={{
                student,
                user,
                isLoading,
                error,
                refresh: fetchStudentData,
            }}
        >
            {children}
        </StudentContext.Provider>
    );
}

export function useStudent() {
    const context = useContext(StudentContext);
    if (context === undefined) {
        throw new Error("useStudent must be used within a StudentProvider");
    }
    return context;
}
