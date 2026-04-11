"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickSandbox from "./quick-sandbox";
import DetailedSandboxClient from "./detailed/client";
import { Sparkles, Zap, LayoutTemplate } from "lucide-react";

export default function SandboxPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 text-foreground animate-in fade-in duration-700 relative z-10 sm:px-6 md:px-10">
      <header className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            AI Sandbox
          </p>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Analyze fit before you apply <Sparkles className="h-6 w-6 text-primary" />
          </h1>
          <p className="mt-1 max-w-3xl text-base leading-relaxed text-muted-foreground">
            Compare a JD against your profile, see score breakdowns, and review improvement signals without leaving the platform.
          </p>
        </div>
      </header>

      {/* Tabs implementation with Dark SaaS UI overrides */}
      <Tabs defaultValue="quick" className="space-y-8">
        <TabsList className="inline-flex h-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm">
          <TabsTrigger 
            value="quick" 
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-muted-foreground transition-all data-[state=active]:bg-muted data-[state=active]:text-foreground"
          >
            <Zap className="h-4 w-4" /> Quick Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="detailed" 
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-muted-foreground transition-all data-[state=active]:bg-muted data-[state=active]:text-foreground"
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