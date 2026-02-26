
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const AUTH_ERRORS: Record<string, string> = {
    AccessDenied: "Access denied. Your account is not authorized for this application.",
    NotAuthorized: "Your account is not registered. Students must use their @stu.upes.ac.in account. Faculty/admin accounts must be pre-registered by an administrator.",
    WrongEmail: "Please sign in with your university email (@stu.upes.ac.in). If you're faculty, contact the admin to get access.",
    NoEmail: "Could not retrieve your email address. Please try again.",
    DatabaseError: "Sign-in failed due to a server error. Please try again later.",
    Configuration: "There is a problem with the server configuration. Please contact support.",
    Verification: "The verification link has expired or has already been used.",
    OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
    Default: "An authentication error occurred. Please try again.",
};

function LoginForm() {
    const searchParams = useSearchParams();
    // Always redirect to "/" post-login — root page.tsx handles role-based routing.
    // This prevents stale callbackUrls (e.g. "/faculty") from sending
    // students to wrong dashboards.
    const callbackUrl = "/";
    const errorType = searchParams.get("error");
    const errorMessage = errorType ? (AUTH_ERRORS[errorType] ?? AUTH_ERRORS.Default) : null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6 text-primary"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.216 50.59 50.59 0 00-2.658.812m-15.482 0a50.57 50.57 0 012.658.812m12.824 0a50.57 50.57 0 002.658-.812"
                            />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl">Welcome to SkillSync</CardTitle>
                    <CardDescription>
                        Sign in with your institutional Microsoft account to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {errorMessage && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                            {errorMessage}
                        </div>
                    )}
                    <Button
                        variant="outline"
                        className="w-full py-6 text-base"
                        onClick={() => signIn("azure-ad", { callbackUrl })}
                    >
                        <div className="mr-2 h-5 w-5">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 21 21"
                            >
                                <title>MS-SymbolLockup</title>
                                <path fill="#f25022" d="M1 1h9v9H1z" />
                                <path fill="#00a4ef" d="M1 11h9v9H1z" />
                                <path fill="#7fba00" d="M11 1h9v9H11z" />
                                <path fill="#ffb900" d="M11 11h9v9H11z" />
                            </svg>
                        </div>
                        Sign in with Microsoft
                    </Button>
                    <div className="text-center text-xs text-muted-foreground">
                        <p>
                            By signing in, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
