"use client";

import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, MessageSquare, RefreshCw, Sparkles, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    case "youtube":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "github":
      return "bg-muted text-foreground border-border";
    case "docs":
      return "bg-primary/15 text-primary border-primary/30";
    case "course":
      return "bg-success/10 text-success border-success/20";
    default:
      return "bg-muted/50 text-foreground border-border";
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
    <div className="min-h-screen bg-muted/20 px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 rounded-md border border-border bg-card/40 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Career Advisor</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Personalized upskilling roadmap based on your eligible drives
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{generatedLabel}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-border bg-card text-foreground hover:bg-muted/50"
            onClick={() => void fetchRoadmap(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </header>

        <Card className="border-none bg-gradient-to-r from-primary/15 via-primary/10 to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5" />
              Snapshot Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3" data-testid="summary-skeleton">
                <div className="h-4 w-11/12 animate-pulse rounded bg-muted/50" />
                <div className="h-4 w-9/12 animate-pulse rounded bg-muted/50" />
                <div className="h-4 w-8/12 animate-pulse rounded bg-muted/50" />
                <p className="pt-2 text-xs text-muted-foreground">Analyzing your profile...</p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {payload?.summary || "No summary available yet."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MessageSquare className="h-5 w-5" />
              Conversation
            </CardTitle>
            <p className="text-xs text-muted-foreground">{messages.length}/{MAX_MESSAGES} messages</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Quick start</p>
                <div className="flex flex-wrap gap-2">
                  {quickStarts.map((chip) => (
                    <Button
                      key={chip}
                      type="button"
                      variant="outline"
                      className="border-border bg-muted/20 text-foreground hover:bg-muted/50"
                      onClick={() => void sendMessage(chip)}
                      disabled={!canSend}
                    >
                      {chip}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-md border border-border bg-muted/20 p-3">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "max-w-[85%] rounded-md px-4 py-2 text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-foreground"
                        : "border border-border bg-muted/50 text-foreground",
                    ].join(" ")}
                  >
                    {message.role === "assistant" ? (
                      <div className="break-words [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-card [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p]:whitespace-pre-wrap [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
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
                  <div
                    data-testid="typing-indicator"
                    className="flex items-center gap-1 rounded-md border border-border bg-muted/50 px-3 py-2"
                  >
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
                  </div>
                </div>
              ) : null}
            </div>

            {sessionComplete ? (
              <p className="text-sm text-warning">Session complete. Refresh to start a new one.</p>
            ) : null}

            <div className="space-y-2">
              <textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={onChatInputKeyDown}
                placeholder={sessionComplete ? "Session complete" : "Ask a question..."}
                disabled={!canSend}
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-muted/20/60 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/30"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void sendMessage()}
                  className="bg-primary hover:bg-primary"
                  disabled={!canSend || !chatInput.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} data-testid="skill-skeleton" className="space-y-3 rounded-md border border-border bg-card p-5">
                <div className="h-6 w-1/2 animate-pulse rounded bg-muted/50" />
                <div className="h-4 w-full animate-pulse rounded bg-muted/50" />
                <div className="h-4 w-10/12 animate-pulse rounded bg-muted/50" />
                <div className="h-16 w-full animate-pulse rounded bg-muted/50" />
              </div>
            ))}
          </section>
        ) : errorText ? (
          <Card className="border border-warning/20 bg-warning/10">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <BookOpen className="h-10 w-10 text-warning" />
              <h2 className="text-xl font-bold text-warning">No drives to analyze</h2>
              <p className="max-w-2xl text-sm text-warning/90">
                {payload?.suggestion || "Complete your profile and wait for active drives to be posted"}
              </p>
              <p className="text-xs text-warning/80">{errorText}</p>
              <Button type="button" className="mt-2 bg-warning/10 text-slate-950 hover:bg-warning/10" onClick={() => void fetchRoadmap(true)}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill, index) => (
              <Card key={`${skill.skill}-${index}`} className="rounded-md border border-border bg-card">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-xl font-black text-primary">{skill.skill}</CardTitle>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {impactLabel(index)}
                    </span>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/50/80 px-2.5 py-1 text-xs text-foreground">
                    Start Week {skill.week_start ?? "?"} · {skill.hours_needed ?? "?"} hours
                  </span>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border border-border bg-muted/20 p-3">
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Target className="h-3.5 w-3.5" /> Why it matters
                    </p>
                    <p className="text-sm text-foreground">{skill.why_critical}</p>
                  </div>

                  <div className="rounded-md border border-border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${resourceTypeClass(skill.resource?.type)}`}>
                        {skill.resource?.type || "Resource"}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{skill.resource?.name || "Recommended Resource"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Search: {skill.resource?.url_description || "Find an official resource"}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {!loading && payload?.amcat_tip && !errorText ? (
          <Card className="border border-warning/20 bg-warning/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                AMCAT Focus Area
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-warning/95">{payload.amcat_tip}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}