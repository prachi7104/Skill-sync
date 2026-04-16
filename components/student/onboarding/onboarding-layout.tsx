/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Onboarding Layout - Gestalt Principle Based
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Master layout component for 6-step onboarding flow
 * Implements Gestalt principles: proximity, similarity, continuity, closure
 *
 * Features:
 * - Vertical progress indicator with step states
 * - Responsive grid (sidebar on desktop, full-width on mobile)
 * - Theme-aware color system with semantic tokens
 * - Visual hierarchy with typography scale
 * - Subtle animations and transitions
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

"use client";

import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  active: boolean;
  locked: boolean;
  required: boolean;
  icon?: React.ReactNode;
}

interface OnboardingLayoutProps {
  steps: OnboardingStep[];
  currentStepKey: string;
  onStepClick?: (stepKey: string) => void;
  children: ReactNode;
  showProgress?: boolean;
}

export function OnboardingLayout({
  steps,
  currentStepKey,
  onStepClick,
  children,
  showProgress = true,
}: OnboardingLayoutProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStepKey);
  const progressPercent = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
      {/* Progress bar (top indicator) */}
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-muted/30 dark:bg-muted/20 z-40">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/70 dark:from-primary dark:via-primary/85 dark:to-primary/60"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8 p-4 md:p-6 lg:p-8 pt-2 lg:pt-8">
        {/* Sidebar - Step Navigation */}
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <div className="lg:sticky lg:top-8 space-y-2">
            <div className="hidden lg:block mb-6">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Setup Progress
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {currentIndex + 1} of {steps.length}
              </p>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => {
                const isCompleted = step.completed;
                const isActive = step.key === currentStepKey;
                const isLocked = step.locked;
                const showLine = idx < steps.length - 1;

                return (
                  <div key={step.key} className="relative">
                    {/* Connector line (Gestalt: continuity) */}
                    {showLine && (
                      <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-muted/30 dark:bg-muted/20" />
                    )}

                    {/* Step item */}
                    <motion.button
                      onClick={() => !isLocked && onStepClick?.(step.key)}
                      disabled={isLocked}
                      whileHover={!isLocked ? { x: 4 } : {}}
                      whileTap={!isLocked ? { x: 2 } : {}}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all duration-200 relative z-10",
                        "flex items-start gap-3",
                        isActive
                          ? "bg-primary/10 dark:bg-primary/15"
                          : "hover:bg-muted/40 dark:hover:bg-muted/20",
                        isLocked && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {/* Step indicator circle (Gestalt: closure) */}
                      <div className="flex-shrink-0 flex items-center justify-center">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-200",
                            isCompleted
                              ? "bg-success/15 dark:bg-success/20 text-success dark:text-success/90"
                              : isActive
                              ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground"
                              : "bg-muted dark:bg-muted/50 text-muted-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : isLocked ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                      </div>

                      {/* Text content (Gestalt: similarity & proximity) */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3
                          className={cn(
                            "text-sm font-semibold truncate transition-colors",
                            isActive
                              ? "text-foreground dark:text-foreground"
                              : "text-muted-foreground dark:text-muted-foreground/80"
                          )}
                        >
                          {step.label}
                          {step.required && !isCompleted && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground/70 truncate mt-0.5">
                          {step.description}
                        </p>
                      </div>

                      {/* Status indicator (Gestalt: figure-ground) */}
                      {isActive && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <ChevronRight className="w-4 h-4 text-primary dark:text-primary" />
                        </div>
                      )}
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <main className="lg:col-span-2 xl:col-span-3 order-1 lg:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export function OnboardingCard({
  title,
  description,
  children,
  icon,
  required = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Header - Gestalt: proximity grouping */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="text-primary dark:text-primary/90 flex-shrink-0 mt-1">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-foreground">
              {title}
              {required && <span className="text-destructive ml-2">*</span>}
            </h2>
            {description && (
              <p className="text-sm md:text-base text-muted-foreground dark:text-muted-foreground/80 mt-1.5">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content area - Card container (Gestalt: figure-ground) */}
      <div className="bg-card dark:bg-card border border-border dark:border-border rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-10">
        {/* Subtle background accent (Gestalt: continuation) */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent dark:from-primary/5 dark:to-transparent rounded-xl md:rounded-2xl pointer-events-none" />

        {/* Content */}
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}

export function OnboardingFieldGroup({
  children,
  cols = 1,
  className,
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  }[cols];

  return (
    <div className={cn(`grid ${colsClass} gap-4 md:gap-6`, className)}>
      {children}
    </div>
  );
}

export function OnboardingInput({
  label,
  required = false,
  error = false,
  helperText,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground dark:text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-2.5 md:py-3 rounded-lg border border-input dark:border-input",
          "bg-background dark:bg-background text-foreground dark:text-foreground",
          "placeholder:text-muted-foreground dark:placeholder:text-muted-foreground/60",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/40 focus:border-transparent",
          "transition-all duration-150",
          error && "border-destructive focus:ring-destructive/50 dark:focus:ring-destructive/40"
        )}
        {...props}
      />
      {helperText && (
        <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
          {helperText}
        </p>
      )}
    </div>
  );
}
