"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { type InferSelectModel } from "drizzle-orm";
import { type students } from "@/lib/db/schema";
import { toast } from "sonner";
import { useProfileStore } from "@/lib/stores/profile-store";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyProfileData = useCallback((data: any) => {
        // API returns { success, data: { user, profile } }
        const payload = data.data ?? data;
        if (payload.profile) {
            setStudent(payload.profile);
            useProfileStore.getState().loadFromDB(payload.profile);
        } else {
            setStudent(payload);
            useProfileStore.getState().loadFromDB(payload);
        }
        if (payload.user) {
            setUser(payload.user);
        }
    }, []);

    const fetchStudentData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch("/api/student/profile");

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Unauthorized");
                }
                throw new Error("Failed to fetch student profile");
            }

            const data = await response.json();
            applyProfileData(data);
        } catch (err) {
            console.error("Error fetching student context:", err);
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
            if (message !== "Unauthorized") {
                toast.error("Could not load student profile");
            }
        } finally {
            setIsLoading(false);
        }
    }, [applyProfileData]);

    // Refresh without setting isLoading to true – prevents unmount/remount
    // cycles when a parent layout returns null while isLoading is true.
    const refreshStudentData = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch("/api/student/profile");
            if (!response.ok) {
                if (response.status === 401) throw new Error("Unauthorized");
                throw new Error("Failed to fetch student profile");
            }
            const data = await response.json();
            applyProfileData(data);
        } catch (err) {
            console.error("Error refreshing student context:", err);
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        }
    }, [applyProfileData]);

    // One-time cleanup: remove any stale data from the old persist middleware
    useEffect(() => {
        localStorage.removeItem("profile-storage");
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
                refresh: refreshStudentData,
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
