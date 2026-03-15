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
    <div className="relative min-h-screen bg-[#050B14] text-white overflow-hidden flex flex-col justify-center font-sans">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/campus.jpg" alt="UPES Campus" fill
          style={{ objectPosition: "35% 50%" }}
          className="object-cover opacity-75 brightness-110 contrast-125"
          priority />
        <div className="absolute inset-0 bg-[#050B14]/20 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050B14] via-[#050B14]/70 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050B14]/10 to-[#050B14] z-10" />
        <div className="absolute bottom-[-10%] right-[5%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen z-10" />
      </div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-16 py-12 lg:py-24 flex flex-col lg:flex-row items-center">
        <div className="w-full lg:w-[55%]">
          {/* Live badge */}
          <div className="inline-flex items-center space-x-2 bg-[#0F172A]/80 border border-slate-700/50 rounded-full px-4 py-2 mb-10 shadow-xl backdrop-blur-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase font-mono">
              Placement Season 2026 Live
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none select-none">
            Skill<span className="text-indigo-500">Sync.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 leading-relaxed mb-12 max-w-xl font-light">
            AI-Native Placement Ecosystem.{" "}
            <strong className="text-white font-semibold">Intelligent matching.</strong>
          </p>

          <div className="max-w-md w-full space-y-4">
            {/* Error message */}
            {errorMessage && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 flex items-start backdrop-blur-md">
                <AlertCircle className="w-6 h-6 text-rose-500 mr-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Error</p>
                  <p className="text-sm font-medium text-rose-200/90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* ── Button 1: Student (Microsoft OAuth) ── */}
            <button
              onClick={handleStudentLogin}
              disabled={isStudentLoading || isStaffLoading}
              className="group relative w-full flex items-center justify-between p-1 bg-[#0F172A]/90 hover:bg-[#1E293B] border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl transition-all duration-300 shadow-2xl backdrop-blur-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <div className="flex items-center px-6 py-5 z-10">
                <svg className="w-7 h-7 mr-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white tracking-tight">Student Login</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
                    UPES Microsoft Account (@stu.upes.ac.in)
                  </p>
                </div>
              </div>
              <div className="px-6 z-10">
                {isStudentLoading
                  ? <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  : <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 transition-colors transform group-hover:translate-x-1" />
                }
              </div>
            </button>

            {/* ── Button 2: Faculty / Staff ── */}
            {!showStaffForm ? (
              <button
                onClick={() => setShowStaffForm(true)}
                disabled={isStudentLoading}
                className="group relative w-full flex items-center justify-between p-1 bg-[#0F172A]/60 hover:bg-[#0F172A]/90 border border-slate-800 hover:border-slate-600 rounded-2xl transition-all duration-300 backdrop-blur-2xl disabled:opacity-50"
              >
                <div className="flex items-center px-6 py-4 z-10">
                  <Lock className="w-6 h-6 mr-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  <div className="text-left">
                    <h3 className="text-base font-bold text-slate-300 tracking-tight">Faculty / Staff Login</h3>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-bold uppercase tracking-wider">
                      Email & Password
                    </p>
                  </div>
                </div>
                <div className="px-6 z-10">
                  <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-slate-400 transition-colors" />
                </div>
              </button>
            ) : (
              <form
                onSubmit={handleStaffLogin}
                className="bg-[#0F172A]/90 border border-slate-700/80 rounded-2xl p-6 space-y-4 backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Staff Login</h3>
                  <button
                    type="button"
                    onClick={() => { setShowStaffForm(false); setErrorMessage(null); }}
                    className="text-slate-600 hover:text-slate-400 text-xs"
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
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={staffPassword}
                    onChange={e => setStaffPassword(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isStaffLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isStaffLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
                </button>
              </form>
            )}

            <div className="mt-6 flex items-start space-x-3 text-[11px] text-slate-500">
              <Sparkles className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
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
      <div className="flex min-h-screen items-center justify-center bg-[#050B14]">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}