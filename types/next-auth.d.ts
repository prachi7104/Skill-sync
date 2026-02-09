
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "student" | "faculty" | "admin";
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role?: "student" | "faculty" | "admin";
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "student" | "faculty" | "admin";
    }
}
