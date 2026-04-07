"use client";

import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, MessageSquare, RefreshCw, Sparkles, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type PrioritySkill = {
  skill: string;
  why_critical: string;
  resource?: {
    type?: string;
    name?: string;
    url_description?: string;
  };
  week_start?: number;
  hours_needed?: number;
};

type CareerCoachPayload = {
  summary?: string;
  priority_skills?: PrioritySkill[];
  amcat_tip?: string;
  message?: string;
  suggestion?: string;
  error?: string;
  cached?: boolean;
  generatedAt?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CoachReply = {
  reply?: string;
  role?: "assistant";
  error?: string;
};

const MAX_MESSAGES = 10;
const QUICK_STARTS = [
  "What drives am I eligible for?",
  "How can I improve my ranking?",
  "Which skills should I learn next?",
];

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^[\*\-] /gm, "")
    .trim();
}

function timeAgoLabel(iso: string | undefined, cached: boolean): string {
  if (!iso) return cached ? "Cached recently" : "Generated recently";
  const deltaMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(deltaMs / 60000));
  if (mins < 60) {
    return cached ? `Cached from ${mins} minutes ago` : `Generated ${mins} minutes ago`;
  }
  const hours = Math.floor(mins / 60);
  return cached ? `Cached from ${hours} hours ago` : `Generated ${hours} hours ago`;
}

function resourceTypeClass(type?: string): string {
  switch ((type ?? "").toLowerCase()) {
    case "youtube": return "destructive";
    case "github": return "secondary";
    case "docs": return "default";
    case "course": return "outline";
    default: return "secondary";
  }
}

function impactLabel(index: number): string {
  if (index === 0) return "Highest Impact";
  if (index === 1) return "High Impact";
  if (index === 2) return "Good to have";
  return "Recommended";
}

export default function CareerCoachPage() {
  const [payload, setPayload] = useState<CareerCoachPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const fetchRoadmap = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setErrorText(null);
    try {
      const endpoint = refresh
        ? "/api/student/career-coach?refresh=1"
        : "/api/student/career-coach";
      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await res.json() as CareerCoachPayload;

      if (!res.ok) {
        setPayload(null);
        setErrorText(stripMarkdown(data.error || "Unable to generate roadmap right now."));
        return;
      }

      if (data.message || data.error || !data.priority_skills?.length) {
        setPayload(data);
        setErrorText(stripMarkdown(data.message || data.error || "No drives to analyze"));
        return;
      }

      setPayload({
        ...data,
        summary: stripMarkdown(data.summary || ""),
        amcat_tip: data.amcat_tip ? stripMarkdown(data.amcat_tip) : undefined,
        priority_skills: (data.priority_skills || []).map((skill) => ({
          ...skill,
          skill: stripMarkdown(skill.skill || "Untitled Skill"),
          why_critical: stripMarkdown(skill.why_critical || ""),
          resource: {
            type: skill.resource?.type,
            name: stripMarkdown(skill.resource?.name || "Resource"),
            url_description: stripMarkdown(skill.resource?.url_description || ""),
          },
        })),
      });
    } catch {
      setPayload(null);
      setErrorText("Unable to load your career roadmap. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoadmap(false);
  }, [fetchRoadmap]);

  const generatedLabel = useMemo(
    () => timeAgoLabel(payload?.generatedAt, !!payload?.cached),
    [payload?.generatedAt, payload?.cached],
  );

  const quickStarts = useMemo(() => QUICK_STARTS, []);
  const sessionComplete = messages.length >= MAX_MESSAGES;
  const canSend = !chatLoading && !sessionComplete;

  const skills = payload?.priority_skills ?? [];

  async function sendMessage(rawMessage?: string) {
    const text = (rawMessage ?? chatInput).trim();
    if (!text || !canSend) return;

    const nextMessages = [...messages, { role: "user", content: text } as ChatMessage];
    setMessages(nextMessages);
    setChatInput("");

    if (nextMessages.length >= MAX_MESSAGES) {
      return;
    }

    setChatLoading(true);
    try {
      const res = await fetch("/api/student/career-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-8),
        }),
      });

      const json = await res.json() as CoachReply;
      const reply = json.reply?.trim() || json.error || "I could not generate a response right now.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network issue while contacting Career Advisor." }]);
    } finally {
      setChatLoading(false);
    }
  }

  function onChatInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Career Advisor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalized upskilling roadmap based on your eligible drives
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">{generatedLabel}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void fetchRoadmap(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Snapshot Summary
        </h2>
        <div className="p-5 border border-border bg-card rounded-md">
            {loading ? (
            <div className="space-y-3" data-testid="summary-skeleton">
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-9/12" />
                <Skeleton className="h-4 w-8/12" />
            </div>
            ) : (
            <p className="text-sm leading-relaxed text-foreground">
                {payload?.summary || "No summary available yet."}
            </p>
            )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Conversation
            </h2>
            <p className="text-xs text-muted-foreground">{messages.length}/{MAX_MESSAGES} messages</p>
        </div>
        
        <div className="border border-border bg-card rounded-md p-5 space-y-4">
            {messages.length === 0 ? (
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Quick start</p>
                <div className="flex flex-wrap gap-2">
                {quickStarts.map((chip) => (
                    <Button
                    key={chip}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={() => void sendMessage(chip)}
                    disabled={!canSend}
                    >
                    {chip}
                    </Button>
                ))}
                </div>
            </div>
            ) : null}

            {messages.length > 0 && (
                <div className="max-h-[420px] space-y-4 overflow-y-auto pr-2">
                {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                        className={[
                        "max-w-[85%] rounded-md px-4 py-2.5 text-sm leading-relaxed border",
                        message.role === "user"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted border-border text-foreground",
                        ].join(" ")}
                    >
                        {message.role === "assistant" ? (
                        <div className="break-words [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-muted-foreground/20 [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p]:whitespace-pre-wrap [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                            </ReactMarkdown>
                        </div>
                        ) : (
                        message.content
                        )}
                    </div>
                    </div>
                ))}

                {chatLoading ? (
                    <div className="flex justify-start">
                    <div data-testid="typing-indicator" className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-4 py-3">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
                    </div>
                    </div>
                ) : null}
                </div>
            )}

            {sessionComplete ? (
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Session complete. Refresh to start a new one.</p>
            ) : null}

            <div className="space-y-3 pt-4 border-t border-border">
            <textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={onChatInputKeyDown}
                placeholder={sessionComplete ? "Session complete" : "Ask a question..."}
                disabled={!canSend}
                rows={2}
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-input"
            />
            <div className="flex justify-end">
                <Button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!canSend || !chatInput.trim()}
                >
                Send
                </Button>
            </div>
            </div>
        </div>
      </section>

      {loading ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} data-testid="skill-skeleton" className="space-y-3 rounded-md border border-border bg-card p-5">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full" />
            </div>
        ))}
        </section>
      ) : errorText ? (
        <div className="rounded-md border border-border bg-card p-12">
            <EmptyState 
                message="No drives to analyze" 
                description={payload?.suggestion || "Complete your profile and wait for active drives to be posted."}
                action={
                    <Button type="button" variant="outline" className="mt-4" onClick={() => void fetchRoadmap(true)}>
                        Retry
                    </Button>
                }
            />
        </div>
      ) : (
        <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Priority Skills</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {skills.map((skill, index) => (
            <div key={`${skill.skill}-${index}`} className="flex flex-col rounded-md border border-border bg-card p-5">
                <div className="space-y-3 mb-4">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-foreground">{skill.skill}</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{impactLabel(index)}</Badge>
                </div>
                <Badge variant="outline" className="text-xs font-normal border-border">
                    Start Week {skill.week_start ?? "?"} · {skill.hours_needed ?? "?"} hours
                </Badge>
                </div>
                <div className="space-y-4 flex-grow">
                <div className="rounded-md border border-border bg-muted/30 p-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Target className="h-3.5 w-3.5" /> Why it matters
                    </p>
                    <p className="text-sm text-foreground">{skill.why_critical}</p>
                </div>

                <div className="rounded-md border border-border bg-muted/30 p-3">
                    <div className="mb-2 flex items-center justify-between">
                    <Badge variant={resourceTypeClass(skill.resource?.type) as any} className="text-[10px] uppercase tracking-wide">{skill.resource?.type || "Resource"}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{skill.resource?.name || "Recommended Resource"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Search: {skill.resource?.url_description || "Find an official resource"}</p>
                </div>
                </div>
            </div>
            ))}
            </div>
        </section>
      )}

      {!loading && payload?.amcat_tip && !errorText ? (
        <div className="rounded-md border border-border bg-card p-5 space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                AMCAT Focus Area
            </h2>
            <p className="text-sm text-muted-foreground">{payload.amcat_tip}</p>
        </div>
      ) : null}
    </div>
  );
}