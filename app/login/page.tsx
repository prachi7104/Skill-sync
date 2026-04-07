"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2, AlertCircle, Sparkles, ChevronRight, Eye, EyeOff, Lock } from "lucide-react";

const AUTH_ERRORS: Record<string, string> = {
  AccessDenied: "Access denied. Your account is not authorized.",
  NotAuthorized: "Use your @stu.upes.ac.in account for student login.",
  Configuration: "Server configuration error. Contact support.",
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

  const navigateToCallback = (targetUrl: string) => {
    try {
      const parsed = new URL(targetUrl, window.location.origin);
      if (parsed.origin === window.location.origin) {
        router.replace(`${parsed.pathname}${parsed.search}${parsed.hash}`);
        return;
      }
      window.location.assign(parsed.toString());
    } catch {
      router.replace("/");
    }
  };

  const handleStudentLogin = async () => {
    setIsStudentLoading(true);
    setErrorMessage(null);
    try {
      const result = await signIn("azure-ad", { callbackUrl: "/", redirect: false });
      if (result?.error) {
        setErrorMessage(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.Default);
        setIsStudentLoading(false);
      } else if (result?.url) {
        navigateToCallback(result.url);
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
        navigateToCallback(result.url);
      }
    } catch {
      setErrorMessage(AUTH_ERRORS.Default);
      setIsStaffLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col justify-center font-sans">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/campus.jpg" alt="UPES Campus" fill
          style={{ objectPosition: "35% 50%" }}
          className="object-cover opacity-30 grayscale contrast-125"
          priority />
        <div className="absolute inset-0 bg-background/80 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent z-10" />
      </div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-16 py-12 lg:py-24 flex flex-col lg:flex-row items-center">
        <div className="w-full lg:w-[55%]">
          {/* Live badge */}
          <div className="inline-flex items-center space-x-2 bg-secondary border border-border rounded-full px-4 py-2 mb-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground tracking-[0.2em] uppercase font-mono">
              Placement Season 2026 Live
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter mb-6 leading-none select-none">
            Skill<span className="text-primary">Sync.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-12 max-w-xl font-light">
            AI-Native Placement Ecosystem.{" "}
            <strong className="text-foreground font-semibold">Intelligent matching.</strong>
          </p>

          <div className="max-w-md w-full space-y-4">
            {/* Error message */}
            {errorMessage && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 mb-6 rounded-md border border-destructive/20 bg-destructive/5 p-5 flex items-start ">
                <AlertCircle className="w-5 h-5 text-destructive mr-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-destructive uppercase tracking-widest">Error</p>
                  <p className="text-sm font-medium text-foreground/80">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="mt-2 text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* ── Button 1: Student (Microsoft OAuth) ── */}
            <button
              onClick={handleStudentLogin}
              disabled={isStudentLoading || isStaffLoading}
              className="group relative w-full flex items-center justify-between p-1 bg-card hover:bg-muted border border-border rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center px-6 py-5 z-10">
                <svg className="w-7 h-7 mr-5 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">Student Login</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">
                    UPES Microsoft Account (@stu.upes.ac.in)
                  </p>
                </div>
              </div>
              <div className="px-6 z-10">
                {isStudentLoading
                  ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  : <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-all group-hover:translate-x-1" />
                }
              </div>
            </button>

            {/* ── Button 2: Faculty / Staff ── */}
            {!showStaffForm ? (
              <button
                onClick={() => setShowStaffForm(true)}
                disabled={isStudentLoading}
                className="group relative w-full flex items-center justify-between p-1 bg-secondary/50 hover:bg-secondary border border-border rounded-md transition-all duration-300 disabled:opacity-50"
              >
                <div className="flex items-center px-6 py-4 z-10">
                  <Lock className="w-5 h-5 mr-5 text-muted-foreground" />
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-muted-foreground tracking-tight">Faculty / Staff Login</h3>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5 font-medium uppercase tracking-wider">
                      Email & Password
                    </p>
                  </div>
                </div>
                <div className="px-6 z-10">
                  <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-all" />
                </div>
              </button>
            ) : (
              <form
                onSubmit={handleStaffLogin}
                className="bg-card border border-border rounded-md p-6 space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Staff Auth</h3>
                  <button
                    type="button"
                    onClick={() => { setShowStaffForm(false); setErrorMessage(null); }}
                    className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    required
                    className="w-full bg-secondary border border-border text-foreground rounded-md px-4 py-2.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={staffPassword}
                    onChange={e => setStaffPassword(e.target.value)}
                    required
                    className="w-full bg-secondary border border-border text-foreground rounded-md px-4 py-2.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isStaffLoading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-medium py-2.5 rounded-md text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isStaffLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
                </button>
              </form>
            )}

            <div className="mt-6 flex items-start space-x-3 text-[11px] text-muted-foreground/60 italic">
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>Students use Microsoft SSO. Faculty & staff use their assigned credentials.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/20" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}