"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickSandbox from "./quick-sandbox";
import DetailedSandboxClient from "./detailed/client";
import { Sparkles, Zap, LayoutTemplate } from "lucide-react";

export default function SandboxPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 text-zinc-900 animate-in fade-in duration-700 relative z-10 sm:px-6 md:px-10 dark:text-slate-100">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-slate-400">
            AI Sandbox
          </p>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-zinc-900 md:text-4xl dark:text-slate-100">
            Analyze fit before you apply <Sparkles className="h-6 w-6 text-primary" />
          </h1>
          <p className="mt-1 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-slate-300">
            Compare a JD against your profile, see score breakdowns, and review improvement signals without leaving the platform.
          </p>
        </div>
      </header>

      {/* Tabs implementation with Dark SaaS UI overrides */}
      <Tabs defaultValue="quick" className="space-y-8">
        <TabsList className="inline-flex h-auto rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <TabsTrigger 
            value="quick" 
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-zinc-500 transition-all data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 dark:text-slate-400 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-100"
          >
            <Zap className="h-4 w-4" /> Quick Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="detailed" 
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-zinc-500 transition-all data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 dark:text-slate-400 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-100"
          >
            <LayoutTemplate className="h-4 w-4" /> Detailed Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-0 outline-none animate-in fade-in duration-500">
          <QuickSandbox />
        </TabsContent>

        <TabsContent value="detailed" className="mt-0 outline-none animate-in fade-in duration-500">
          <DetailedSandboxClient />
        </TabsContent>
      </Tabs>
    </div>
  );
}