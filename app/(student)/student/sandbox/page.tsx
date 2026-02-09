"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SandboxResult {
  matchScore: number;
  semanticScore: number;
  structuredScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  shortExplanation: string;
  detailedExplanation: string;
  isEligible: boolean;
  ineligibilityReason?: string;
  usage: {
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    monthlyLimit: number;
  };
}

interface ErrorResponse {
  code?: string;
  reason?: string;
  nextStep?: string;
  message?: string;
}

export default function SandboxPage() {
  const [jdText, setJdText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);

  async function handleSubmit() {
    if (jdText.trim().length < 20) {
      setError({ message: "Please enter at least 20 characters of JD text." });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/student/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data);
        return;
      }

      setResult(data);
    } catch {
      setError({ message: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  }

  function getScoreBarColor(score: number): string {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">AI Sandbox</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paste a job description to see how your profile matches. Results include
          skill analysis, score breakdown, and improvement suggestions.
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job Description</CardTitle>
          <CardDescription>
            Paste the full JD text below to analyze your match.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={8}
            placeholder="Paste the job description here..."
            className="resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {jdText.length} characters
            </span>
            <Button onClick={handleSubmit} disabled={isLoading || jdText.trim().length < 20}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                "Analyze Match"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-sm text-red-700">
              <p className="font-medium">{error.reason || error.message || "An error occurred"}</p>
              {error.nextStep && (
                <p className="mt-1 text-red-600">{error.nextStep}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Score Gauge */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Match Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(result.matchScore)}`}>
                    {result.matchScore.toFixed(1)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">out of 100</p>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Structured Score</span>
                      <span className="font-medium">{result.structuredScore.toFixed(1)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full transition-all ${getScoreBarColor(result.structuredScore)}`}
                        style={{ width: `${Math.min(result.structuredScore, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Semantic Score</span>
                      <span className="font-medium">{result.semanticScore.toFixed(1)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full transition-all ${getScoreBarColor(result.semanticScore)}`}
                        style={{ width: `${Math.min(result.semanticScore, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {!result.isEligible && (
                <div className="mt-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  <span className="font-medium">Not Eligible:</span> {result.ineligibilityReason}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skill Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-2">
                    Matched Skills ({result.matchedSkills.length})
                  </h4>
                  {result.matchedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No skills matched</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-2">
                    Missing Skills ({result.missingSkills.length})
                  </h4>
                  {result.missingSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {result.missingSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/20"
                        >
                          ✗ {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      All required skills covered!
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-gray-800 mb-3">
                {result.shortExplanation}
              </p>
              <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 rounded-md p-4 font-mono">
                {result.detailedExplanation}
              </pre>
            </CardContent>
          </Card>

          {/* Usage Counter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Daily Usage</span>
                    <span className="font-medium">
                      {result.usage.dailyUsed} / {result.usage.dailyLimit}
                    </span>
                  </div>
                  <Progress
                    value={(result.usage.dailyUsed / result.usage.dailyLimit) * 100}
                    className="h-2"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Monthly Usage</span>
                    <span className="font-medium">
                      {result.usage.monthlyUsed} / {result.usage.monthlyLimit}
                    </span>
                  </div>
                  <Progress
                    value={(result.usage.monthlyUsed / result.usage.monthlyLimit) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
