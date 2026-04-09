"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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
    <div className="min-h-screen bg-background text-foreground grid grid-cols-1 lg:grid-cols-2 font-sans">
      
      {/* Left form side */}
      <div className="flex flex-col justify-center px-6 lg:px-16 py-12 lg:py-24 relative z-20">
        <div className="w-full max-w-xl mx-auto lg:mx-0">
          {/* Live badge */}
          <div className="inline-flex items-center space-x-2 bg-muted border border-border rounded-md px-4 py-2 mb-10 shadow-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase font-mono">
              Placement Season 2026 Live
            </span>
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-none select-none">
            Skill<span className="text-primary">Sync.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-12 max-w-xl font-light">
            AI-Native Placement Ecosystem.{" "}
            <strong className="text-foreground font-semibold">Intelligent matching.</strong>
          </p>

          <div className="max-w-md w-full space-y-4">
            {/* Error message */}
            {errorMessage && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 mb-6 rounded-md border border-destructive/30 bg-destructive/10 p-5 flex items-start">
                <AlertCircle className="w-6 h-6 text-destructive mr-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-destructive uppercase tracking-widest">Error</p>
                  <p className="text-sm font-medium text-destructive/90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* ── Button 1: Student (Microsoft OAuth) ── */}
            <button
              onClick={handleStudentLogin}
              disabled={isStudentLoading || isStaffLoading}
              className="group relative w-full flex items-center justify-between p-1 bg-background hover:bg-muted border border-border rounded-md transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center px-6 py-5 z-10">
                <svg className="w-7 h-7 mr-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Student Login</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider">
                    UPES Microsoft Account (@stu.upes.ac.in)
                  </p>
                </div>
              </div>
              <div className="px-6 z-10">
                {isStudentLoading
                  ? <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  : <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
                }
              </div>
            </button>

            {/* ── Button 2: Faculty / Staff ── */}
            {!showStaffForm ? (
              <button
                onClick={() => setShowStaffForm(true)}
                disabled={isStudentLoading}
                className="group relative w-full flex items-center justify-between p-1 bg-transparent hover:bg-muted border border-border rounded-md transition-all duration-300 disabled:opacity-50"
              >
                <div className="flex items-center px-6 py-4 z-10">
                  <Lock className="w-6 h-6 mr-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div className="text-left">
                     <h3 className="text-base font-bold text-foreground tracking-tight">Faculty / Staff Login</h3>
                     <p className="text-[11px] text-muted-foreground mt-0.5 font-bold uppercase tracking-wider">
                      Email & Password
                    </p>
                  </div>
                </div>
                <div className="px-6 z-10">
                  <ChevronRight className="w-5 h-5 text-muted-foreground transition-colors" />
                </div>
              </button>
            ) : (
              <form
                onSubmit={handleStaffLogin}
                 className="bg-background border border-border rounded-md p-6 space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Staff Login</h3>
                  <button
                    type="button"
                    onClick={() => { setShowStaffForm(false); setErrorMessage(null); }}
                    className="text-muted-foreground hover:text-foreground text-xs"
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
                    className="w-full bg-background border border-border text-foreground rounded-md px-4 py-3 text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={staffPassword}
                    onChange={e => setStaffPassword(e.target.value)}
                    required
                    className="w-full bg-background border border-border text-foreground rounded-md px-4 py-3 text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors pr-12"
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
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold py-3 rounded-md text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isStaffLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
                </button>
              </form>
            )}

            <div className="mt-6 flex items-start space-x-3 text-[11px] text-muted-foreground">
              <Sparkles className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p>Students use Microsoft SSO. Faculty & staff use their assigned credentials.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right background half */}
      <div className="hidden lg:block relative z-0 bg-muted/30 border-l border-border">
        <Image src="/campus.jpg" alt="UPES Campus" fill
          style={{ objectPosition: "center" }}
          className="object-cover opacity-80 mix-blend-multiply"
          priority />
        <div className="absolute inset-0 bg-background/50" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}