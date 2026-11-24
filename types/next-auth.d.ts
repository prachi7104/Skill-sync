
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "student" | "faculty" | "admin";
            collegeId: string;
            /** True for anonymous guest-mode sessions (never institutional). */
            isGuest?: boolean;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role?: "student" | "faculty" | "admin";
        collegeId?: string;
        isGuest?: boolean;
        guestExpiresAt?: number;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "student" | "faculty" | "admin";
        collegeId: string;
        isGuest?: boolean;
        guestExpiresAt?: number;
    }
}
