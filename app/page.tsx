"use client";
import Link from 'next/link'; 
import { Users, LayoutDashboard, GraduationCap, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="h-screen w-screen bg-[#0f172a] font-sans overflow-hidden flex flex-col lg:flex-row relative">
      <img src="/upes.jpg" alt="UPES Campus" className="absolute inset-0 w-full h-full object-cover object-[75%_center] opacity-100 z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-transparent z-10"></div>

      <div className="relative z-20 h-full w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row">
        <div className="w-full lg:w-[48%] h-full flex flex-col justify-center">
           <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-indigo-300 text-xs font-bold w-fit mb-8 backdrop-blur-md">
                Placement Season 2026 Live
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-xl">
                Skill<span className="text-indigo-500">Sync.</span>
              </h1>
              <p className="text-slate-300 text-lg lg:text-xl max-w-lg mb-10 leading-relaxed font-medium drop-shadow-md">
                The AI-Native Placement Ecosystem. We bridge the gap between talent and opportunity with <span className="text-white font-bold">intelligent matching.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mb-12">
                 <Link href="/student" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-500/80 to-indigo-900/40 hover:to-indigo-500/80 transition-all duration-300 shadow-lg">
                   <div className="relative h-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between hover:bg-slate-900/70 transition-colors">
                      <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-indigo-500/30 text-indigo-300"><Users size={24}/></div><div><h3 className="text-lg font-bold text-white">Student</h3><p className="text-xs text-slate-300">Login to Cockpit</p></div></div>
                   </div>
                 </Link>
                 <Link href="/faculty" className="flex-1 group relative p-px rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-500/80 to-emerald-900/40 hover:to-emerald-500/80 transition-all duration-300 shadow-lg">
                   <div className="relative h-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between hover:bg-slate-900/70 transition-colors">
                      <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-lg bg-emerald-500/30 text-emerald-300"><LayoutDashboard size={24}/></div><div><h3 className="text-lg font-bold text-white">Faculty</h3><p className="text-xs text-slate-300">Admin Dashboard</p></div></div>
                   </div>
                 </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}