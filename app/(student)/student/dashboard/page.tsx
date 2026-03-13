"use client";

import { useStudent } from "@/app/(student)/providers/student-provider";
import { useRouter } from "next/navigation";
import { computeCompleteness } from "@/lib/profile/completeness";
import { 
    FileText, ArrowRight, Sparkles, AlertCircle, 
    Briefcase, Award, BarChart3, Eye, CheckCircle2,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { getOnboardingRoute, TOTAL_ONBOARDING_STEPS } from "@/lib/onboarding/config";

export default function StudentDashboard() {
    const { user, student, isLoading } = useStudent();
    const router = useRouter();
    const [stats, setStats] = useState({ activeDrivesCount: 0, rankingsCount: 0 });

    useEffect(() => {
        if (!isLoading && student) {
            if (student.onboardingStep < TOTAL_ONBOARDING_STEPS) {
                router.push(getOnboardingRoute(student.onboardingStep));
            }
        }
    }, [isLoading, student, router]);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/student/dashboard/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {}
        }
        if (student) fetchStats();
    }, [student]);

    if (isLoading || !student || !user) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const { score, missing } = computeCompleteness({
        ...student,
        name: user.name,
        email: user.email,
    });
    
    const activeDrives = stats?.activeDrivesCount ?? 0;
    const rankings = stats?.rankingsCount ?? 0;
    const sandboxUsageToday = student.sandboxUsageToday ?? 0;

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-8 md:p-10 pb-20">
            
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-sm">
                    Student Dashboard
                </h1>
                <p className="text-slate-400 text-lg font-medium">
                    Welcome back, <span className="text-slate-100 font-bold">{user.name}</span>. Here's what's happening.
                </p>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Placement Drives" value={activeDrives} icon={Briefcase} subtitle="Active now" />
                <StatCard title="Rankings" value={rankings} icon={Award} subtitle="Received" />
                <StatCard title="Profile Score" value={`${score}%`} icon={BarChart3} subtitle="Completeness" />
                <StatCard title="Sandbox Usage" value={`${sandboxUsageToday}/5`} icon={Eye} subtitle="Today" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* Resume Status Card */}
                <div className="lg:col-span-2 bg-slate-900/60 rounded-[2.5rem] border border-white/5 p-8 space-y-6 relative overflow-hidden group">
                    <div className="flex items-center space-x-3 text-indigo-400 relative z-10">
                        <FileText className="w-6 h-6" />
                        <h3 className="font-bold text-white text-xl tracking-tight">Resume Status</h3>
                    </div>
                    <p className="text-slate-300 font-medium relative z-10">Your current master resume on file.</p>
                    
                    <div className="bg-slate-950/50 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between border border-white/5 hover:border-indigo-500/40 transition-colors duration-300 relative z-10">
                        {student.resumeUrl ? (
                            <>
                                <div className="mb-5 sm:mb-0">
                                    <p className="font-bold text-slate-100 text-base truncate max-w-[300px]">
                                        {student.resumeFilename || "Resume.pdf"}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1.5 font-bold tracking-wide uppercase">
                                        Uploaded {student.resumeUploadedAt ? format(new Date(student.resumeUploadedAt), "MMM d, yyyy") : "Recently"}
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <a href={student.resumeUrl} target="_blank" rel="noreferrer"
                                       className="px-6 py-2.5 border border-white/10 bg-white/5 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-all">
                                        View
                                    </a>
                                    <Link href="/student/profile"
                                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                                        Update
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 w-full">
                                <div className="p-3 bg-amber-500/10 rounded-full shrink-0">
                                    <AlertCircle className="h-6 w-6 text-amber-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-white text-base">No Resume Uploaded</p>
                                    <p className="text-sm text-slate-400 mt-1 font-medium">AI match rates are significantly lower without a resume.</p>
                                </div>
                                <Link href="/student/onboarding/resume"
                                      className="px-6 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-slate-200 transition-all whitespace-nowrap shadow-lg">
                                    Upload Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Completeness Score */}
                <div className="bg-slate-900/60 rounded-[2.5rem] border border-white/5 p-8 space-y-8 relative overflow-hidden">
                    <h3 className="font-bold text-white flex items-center space-x-3 text-xl tracking-tight">
                        <Sparkles className="w-6 h-6 text-emerald-400" />
                        <span>Completeness</span>
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <p className="text-3xl font-black text-white tracking-tighter">{score}%</p>
                            <p className="text-sm font-bold text-emerald-400 mb-1">Excellent</p>
                        </div>
                        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                           <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.6)]" style={{ width: `${score}%` }} />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        {missing.length > 0 ? (
                            <>
                                <p className="text-sm font-bold text-slate-300 mb-3 tracking-tight">Action Items:</p>
                                <ul className="text-sm text-slate-400 space-y-3 list-none font-medium">
                                    {missing.slice(0, 3).map((msg, i) => (
                                        <li key={i} className="flex items-start">
                                            <span className="mr-3 text-indigo-500 font-bold">•</span>
                                            {msg}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <p className="text-sm font-bold text-emerald-400 flex items-center bg-emerald-400/10 p-4 rounded-xl border border-emerald-400/20">
                                <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
                                Profile is perfectly optimized.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Sections Grid */}
            <div className="bg-slate-900/60 rounded-[2.5rem] border border-white/5 p-8 md:p-10">
                <h3 className="font-bold text-white mb-8 text-xl tracking-tight">Data Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <ProfileSectionItem label="Core Skills" count={student.skills?.length || 0} min={5} />
                   <ProfileSectionItem label="Projects" count={student.projects?.length || 0} min={2} />
                   <ProfileSectionItem label="Work Experience" count={student.workExperience?.length || 0} min={0} isOptional />
                   <ProfileSectionItem label="Certifications" count={student.certifications?.length || 0} min={0} isOptional />
                </div>
                <div className="mt-10 flex justify-end">
                   <Link href="/student/profile"
                         className="group flex items-center bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-8 py-4 font-bold text-sm hover:bg-slate-900 hover:text-white hover:border-slate-600 transition-all shadow-sm">
                         Manage Full Profile 
                         <ArrowRight className="ml-3 w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-white transition-all" />
                   </Link>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon: Icon }: any) {
  return (
    <div className="bg-slate-900/60 p-7 rounded-2xl border border-white/5 relative group hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all duration-300 overflow-hidden">
      <div className="flex flex-col justify-between h-full space-y-6 relative z-10">
        <h4 className="text-sm font-bold text-slate-300 tracking-tight uppercase tracking-[0.1em]">{title}</h4>
        <div>
            <p className="text-4xl font-black text-white tracking-tighter leading-none">{value ?? 0}</p>
            <p className="text-[11px] font-bold text-slate-500 mt-2.5 tracking-[0.1em] uppercase">{subtitle}</p>
        </div>
      </div>
      <div className="absolute top-6 right-6 p-3 bg-white/5 rounded-2xl group-hover:bg-indigo-500/20 transition-colors duration-300 relative z-10">
        <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors duration-300" />
      </div>
    </div>
  );
}

function ProfileSectionItem({ label, count, min, isOptional }: any) {
  const isGood = count >= min;
  return (
    <div className="flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-slate-950/50 hover:bg-slate-900 hover:border-white/10 transition-all duration-300">
      <div>
        <p className="font-bold text-slate-100 text-base tracking-tight">{label}</p>
        <p className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase tracking-[0.15em]">
          {isOptional ? "Optional Data" : `Min Req: ${min}`}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-2xl font-black text-white tracking-tighter">{count ?? 0}</span>
        <div className={isGood ? "bg-white/10 rounded-xl p-2" : "bg-rose-500/10 border border-rose-500/20 rounded-xl p-2"}>
           {isGood ? (
               <CheckCircle2 className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
           ) : (
               <AlertCircle className="w-5 h-5 text-rose-400" strokeWidth={2.5} />
           )}
        </div>
      </div>
    </div>
  );
}