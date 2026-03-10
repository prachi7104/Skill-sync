"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Zap, Target, Code, ArrowRight } from 'lucide-react';
import { Badge } from '../components/ui';

export default function StudentDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                 <div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="text-white w-5 h-5"/></div>
                 <span className="font-bold text-xl">SkillSync</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <button className="px-4 py-2 rounded-lg text-sm font-bold text-indigo-600 bg-indigo-50 flex items-center gap-2"><LayoutDashboard size={16} /> Cockpit</button>
            </div>
        </div>
      </nav>

      <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl">
          <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back, Saksham</h1>
          <p className="text-slate-400 text-lg">Your placement probability has increased by <span className="text-emerald-400 font-bold">12%</span> this week.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Target size={20}/></div><h3 className="font-bold text-slate-800">Your Status</h3></div>
             <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Batch Category</span><Badge color="indigo">Alpha Batch</Badge></div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
             <div className="mb-2"><h3 className="font-bold text-slate-800">Quick Access</h3></div>
             <button className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group text-left">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Code size={18} className="text-indigo-600"/></div>
                <div className="flex-1"><h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">Open Sandbox</h4></div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500"/>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}