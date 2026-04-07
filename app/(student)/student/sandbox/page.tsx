"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickSandbox from "./quick-sandbox";
import DetailedSandboxClient from "./detailed/client";
import { Zap, LayoutTemplate } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SandboxPage() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8 animate-fade-up">
        
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          AI Sandbox
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze your profile against Job Descriptions using advanced LLM matching.
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="quick" className="space-y-6">
        
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-grid">
          <TabsTrigger value="quick" className="flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5" /> Quick Analysis
          </TabsTrigger>
          
          <TabsTrigger value="detailed" className="flex items-center gap-2 text-xs">
            <LayoutTemplate className="w-3.5 h-3.5" /> Detailed Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="m-0 border border-border rounded-md bg-card">
          <QuickSandbox />
        </TabsContent>

        <TabsContent value="detailed" className="m-0 border border-border rounded-md bg-card">
          <DetailedSandboxClient />
        </TabsContent>
        
      </Tabs>
    </div>
  );
}