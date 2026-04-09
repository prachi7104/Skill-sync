"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickSandbox from "./quick-sandbox";
import DetailedSandboxClient from "./detailed/client";
import { Sparkles, Zap, LayoutTemplate } from "lucide-react";

export default function SandboxPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-700 relative z-10">
        
      {/* Premium Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
          AI Sandbox <Sparkles className="w-6 h-6 text-primary" />
        </h1>
        <p className="text-muted-foreground mt-1 text-base">
          Analyze your profile against Job Descriptions using advanced LLM matching.
        </p>
      </div>

      {/* Tabs implementation with Dark SaaS UI overrides */}
      <Tabs defaultValue="quick" className="space-y-8">
        
        {/* Styled to look like a premium segmented control */}
        <TabsList className="bg-card  p-1.5 rounded-md border border-border inline-flex h-auto shadow-sm">
          <TabsTrigger 
            value="quick" 
            className="px-6 py-2.5 rounded-md text-sm font-bold data-[state=active]:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:shadow-md text-muted-foreground hover:text-muted-foreground transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> Quick Analysis
          </TabsTrigger>
          
          <TabsTrigger 
            value="detailed" 
            className="px-6 py-2.5 rounded-md text-sm font-bold data-[state=active]:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:shadow-md text-muted-foreground hover:text-muted-foreground transition-all flex items-center gap-2"
          >
            <LayoutTemplate className="w-4 h-4" /> Detailed Analysis
          </TabsTrigger>
        </TabsList>

        {/* Real Backend-Connected Components */}
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