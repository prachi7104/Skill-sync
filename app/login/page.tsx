"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loader2, AlertCircle, Sparkles, ChevronRight } from "lucide-react";

const AUTH_ERRORS: Record<string, string> = {
    AccessDenied: "Access denied. Your account is not authorized.",
    NotAuthorized: "Institutional access only. Students must use @stu.upes.ac.in account.",
    Configuration: "There is a problem with the server configuration. Please contact support.",
    Verification: "The sign-in link has expired or has already been used.",
    OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
    OAuthSignin: "Could not connect to Microsoft. Please check your internet or try again.",
    Default: "An authentication error occurred. Please try again.",
};

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const errorType = searchParams.get("error");
    
    const [errorMessage, setErrorMessage] = useState<string | null>(
        errorType ? (AUTH_ERRORS[errorType] ?? AUTH_ERRORS.Default) : null
    );
    
    const [isAutoSigningIn] = useState(false);
    const [isManualSigningIn, setIsManualSigningIn] = useState(false);

    useEffect(() => {
        if (errorType) {
            const timer = setTimeout(() => {
                router.replace('/login'); 
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [errorType, router]);

    const handleMicrosoftLogin = async () => {
        setIsManualSigningIn(true);
        setErrorMessage(null);

        try {
            const result = await signIn("azure-ad", { 
                callbackUrl: "/", 
                redirect: false 
            });

            if (result?.error) {
                setErrorMessage(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.OAuthSignin);
                setIsManualSigningIn(false);
            } else if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            setErrorMessage(AUTH_ERRORS.Default);
            setIsManualSigningIn(false);
        }
    };

    if (isAutoSigningIn) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#050B14] text-white">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-500" />
                <p className="mt-4 text-sm font-medium text-slate-400 tracking-widest uppercase font-mono tracking-widest">Verifying Session...</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#050B14] text-white overflow-hidden flex flex-col justify-center font-sans">
            
            {/* Cinematic Background Elements */}
            <div className="absolute inset-0 z-0">
                <Image 
                    src="/campus.jpg" 
                    alt="UPES Campus"
                    fill
                    // UPDATED: Shifting to 35% horizontal to bring more of the building/slogan into view
                    style={{ objectPosition: '35% 50%' }}
                    className="object-cover opacity-75 brightness-110 contrast-125 transition-opacity duration-1000" 
                    priority
                />
                
                {/* 1. Global Overlay Tint */}
                <div className="absolute inset-0 bg-[#050B14]/20 z-10" /> 

                {/* 2. Horizontal Gradient - Darker on the left for text contrast */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#050B14] via-[#050B14]/70 to-transparent z-10" />
                
                {/* 3. Bottom Gradient - Pushed further down to keep "Tomorrow" clear */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050B14]/10 to-[#050B14] z-10" />

                {/* 4. Subtle Ambient Glow */}
                <div className="absolute bottom-[-10%] right-[5%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen z-10" />
            </div>

            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-16 py-12 lg:py-24 flex flex-col lg:flex-row items-center">
                <div className="w-full lg:w-[60%]">
                    
                    <div className="inline-flex items-center space-x-2 bg-[#0F172A]/80 border border-slate-700/50 rounded-full px-4 py-2 mb-10 shadow-xl backdrop-blur-xl">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase font-mono tracking-widest">Placement Season 2026 Live</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none select-none">
                        Skill<span className="text-indigo-500">Sync.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 leading-relaxed mb-12 max-w-xl font-light">
                        The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <strong className="text-white font-semibold">intelligent matching.</strong>
                    </p>

                    <div className="max-w-md w-full space-y-4">
                        {errorMessage && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 flex items-start backdrop-blur-md">
                                <AlertCircle className="w-6 h-6 text-rose-500 mr-4 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-rose-400 uppercase tracking-widest leading-none">Authentication Error</p>
                                    <p className="text-sm font-medium text-rose-200/90 leading-snug">{errorMessage}</p>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleMicrosoftLogin}
                            disabled={isManualSigningIn}
                            className="group relative w-full flex items-center justify-between p-1 bg-[#0F172A]/90 hover:bg-[#1E293B] border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl transition-all duration-300 shadow-2xl backdrop-blur-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="flex items-center px-6 py-5 z-10">
                                <svg className="w-7 h-7 mr-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                                </svg>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white tracking-tight">Sign in with Microsoft</h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">UPES Institutional Access</p>
                                </div>
                            </div>

                            <div className="px-6 z-10">
                                {isManualSigningIn ? (
                                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                                ) : (
                                    <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 transition-colors transform group-hover:translate-x-1" />
                                )}
                            </div>
                        </button>

                        <div className="mt-8 flex items-start space-x-3 text-[11px] text-slate-500 leading-relaxed font-medium">
                            <Sparkles className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                            <p>Authorized access only. Use your <span className="text-slate-300 font-bold tracking-tight">UPES Outlook</span> credentials. Dashboard routing is automatic.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#050B14]"><Loader2 className="h-12 w-12 animate-spin text-indigo-500" /></div>}>
            <LoginForm />
        </Suspense>
    );
}