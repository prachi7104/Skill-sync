"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickSandbox from "./quick-sandbox";
import DetailedSandboxClient from "./detailed/client";

export default function SandboxPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Sandbox</h1>
        <p className="text-muted-foreground">
          Analyze your profile against Job Descriptions using AI.
        </p>
      </div>

      <Tabs defaultValue="quick" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="quick">Quick Analysis</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="space-y-6">
          <QuickSandbox />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <DetailedSandboxClient />
        </TabsContent>
      </Tabs>
    </div>
  );
}
