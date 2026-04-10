"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import LoginFormPanel from '@/components/auth/login-form-panel';
import LoginBrandPanel from '@/components/auth/login-brand-panel';

const AUTH_ERRORS: Record<string, string> = {
  AccessDenied: "Access denied. Your account is not authorized.",
  NotAuthorized: "Use your @stu.upes.ac.in account for student login.",
  CredentialsSignin: "Incorrect email or password.",
  Default: "An authentication error occurred. Please try again.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorType = searchParams.get("error");

  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorType ? (AUTH_ERRORS[errorType] ?? AUTH_ERRORS.Default) : null
  );
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (errorType) {
      const timer = setTimeout(() => router.replace("/login"), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorType, router]);

  const handleStudentLogin = async () => {
    setIsStudentLoading(true);
    setErrorMessage(null);
    try {
      const result = await signIn("azure-ad", { callbackUrl: "/", redirect: false });
      if (result?.error) {
        setErrorMessage(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.Default);
        setIsStudentLoading(false);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setErrorMessage(AUTH_ERRORS.Default);
      setIsStudentLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStaffLoading(true);
    setErrorMessage(null);
    try {
      const result = await signIn("staff-credentials", {
        email: staffEmail,
        password: staffPassword,
        callbackUrl: "/",
        redirect: false,
      });
      if (result?.error) {
        setErrorMessage(AUTH_ERRORS.CredentialsSignin);
        setIsStaffLoading(false);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setErrorMessage(AUTH_ERRORS.Default);
      setIsStaffLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-background font-sans grid grid-cols-1 lg:grid-cols-[1fr_1fr]'>
      <LoginFormPanel
        errorMessage={errorMessage}
        isStudentLoading={isStudentLoading}
        isStaffLoading={isStaffLoading}
        showStaffForm={showStaffForm}
        staffEmail={staffEmail}
        staffPassword={staffPassword}
        showPassword={showPassword}
        onStudentLogin={handleStudentLogin}
        onShowStaffForm={() => setShowStaffForm(true)}
        onHideStaffForm={() => { setShowStaffForm(false); setErrorMessage(null); }}
        onStaffEmailChange={(v) => setStaffEmail(v)}
        onStaffPasswordChange={(v) => setStaffPassword(v)}
        onTogglePassword={() => setShowPassword(v => !v)}
        onStaffSubmit={handleStaffLogin}
      />
      <LoginBrandPanel />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}