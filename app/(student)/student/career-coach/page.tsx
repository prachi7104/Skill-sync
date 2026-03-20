"use client";

import { KeyboardEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function CareerCoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionComplete = messages.length >= MAX_MESSAGES;
  const canSend = !loading && !sessionComplete;

  const quickStarts = useMemo(() => QUICK_STARTS, []);

  async function sendMessage(rawMessage?: string) {
    const text = (rawMessage ?? input).trim();
    if (!text || !canSend) return;

    const nextMessages = [...messages, { role: "user", content: text } as ChatMessage];
    setMessages(nextMessages);
    setInput("");

    if (nextMessages.length >= MAX_MESSAGES) {
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Career Coach</h1>
          <p className="mt-1 text-sm text-slate-400">Ask follow-up questions and build a focused career strategy in one session.</p>
        </div>
        <div className="text-xs text-slate-500">{messages.length}/{MAX_MESSAGES} messages</div>
      </div>

      <Card className="border-white/10 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="text-white">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Quick start</p>
              <div className="flex flex-wrap gap-2">
                {quickStarts.map((chip) => (
                  <Button
                    key={chip}
                    type="button"
                    variant="outline"
                    className="border-white/20 bg-slate-950/40 text-slate-200 hover:bg-slate-800"
                    onClick={() => void sendMessage(chip)}
                    disabled={!canSend}
                  >
                    {chip}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="max-h-[460px] space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/40 p-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "border border-white/10 bg-slate-800 text-slate-100",
                  ].join(" ")}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div
                  data-testid="typing-indicator"
                  className="flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-800 px-3 py-2"
                >
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:240ms]" />
                </div>
              </div>
            ) : null}
          </div>

          {sessionComplete ? (
            <p className="text-sm text-amber-300">Session complete. Refresh to start a new one.</p>
          ) : null}

          <div className="space-y-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={sessionComplete ? "Session complete" : "Ask a question..."}
              disabled={!canSend}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => void sendMessage()}
                className="bg-indigo-600 hover:bg-indigo-500"
                disabled={!canSend || !input.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}