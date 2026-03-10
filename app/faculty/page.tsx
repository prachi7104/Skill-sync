"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, LayoutDashboard, Briefcase, Plus } from 'lucide-react';
import { Badge, StatCard } from '../components/ui';

export default function FacultyDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-400 fixed h-full z-20 flex-col border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800 cursor-pointer" onClick={() => router.push('/')}>
          <div className="p-1.5 bg-indigo-500 rounded"><Zap className="text-white w-4 h-4 fill-current"/></div>
          <span className="text-xl font-bold tracking-tight">SkillSync</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
           <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}><LayoutDashboard size={18}/> Command Center</button>
           <button onClick={() => setActiveTab('drives')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'drives' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}><Briefcase size={18}/> Manage Drives</button>
        </nav>
      </aside>

      <main className="w-full md:ml-64 flex-1 p-4 md:p-8">
        <header className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
           <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2"><Plus size={18}/> Create Drive</button>
        </header>

        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
               <StatCard label="Total Students" value="500" sub="Across 4 branches" />
               <StatCard label="Placed" value="350" sub="70% Success Rate" color="emerald" />
               <StatCard label="Unplaced" value="150" sub="Actively seeking" color="rose" />
               <StatCard label="Active Drives" value="12" sub="Open opportunities" color="indigo" highlight />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800">Live Drive Monitor</h3>
               </div>
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                     <tr><th className="px-6 py-3">Company</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     <tr className="hover:bg-slate-50 border-b border-slate-50 last:border-0">
                        <td className="px-6 py-4 font-bold">Amazon</td>
                        <td className="px-6 py-4">SDE-1</td>
                        <td className="px-6 py-4"><Badge color="emerald">Live</Badge></td>
                     </tr>
                  </tbody>
               </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}