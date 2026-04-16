/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Onboarding Progress Bar - Premium Visual Component
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Beautiful, animated progress indicator with theme support
 * Perfect for both light and dark modes
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    key: string;
    label: string;
    completed: boolean;
    locked: boolean;
  }>;
  onStepClick?: (stepIndex: number) => void;
  showPercentage?: boolean;
}

/**
 * Gestalt-based progress bar with:
 * - Proximity: Steps grouped together
 * - Similarity: Consistent step styling
 * - Continuity: Connecting line flow
 * - Closure: Filled circles for completed steps
 * - Figure-ground: Clear visual separation
 */
export function OnboardingProgressBar({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
  showPercentage = true,
}: OnboardingProgressBarProps) {
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full space-y-6">
      {/* Animated progress rail */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-75">
            Progress
          </span>
          {showPercentage && (
            <motion.span
              key={progressPercent}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-semibold text-primary"
            >
              {Math.round(progressPercent)}%
            </motion.span>
          )}
        </div>

        {/* Progress track - Gestalt: Continuity */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30 dark:bg-muted/20">
          {/* Shimmer effect in light mode */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/5" />

          {/* Animated progress fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{
              duration: 0.8,
              ease: [0.34, 1.56, 0.64, 1], // Custom spring curve
            }}
            className={cn(
              "h-full rounded-full transition-all",
              "bg-gradient-to-r from-primary via-primary/85 to-primary/70",
              "dark:from-primary dark:via-primary/80 dark:to-primary/60",
              "shadow-lg shadow-primary/30 dark:shadow-primary/20",
            )}
          />
        </div>
      </div>

      {/* Step indicators - Gestalt: Proximity & Similarity */}
      <div className="flex justify-between gap-1 sm:gap-2">
        {steps.map((step, idx) => {
          const isCompleted = step.completed;
          const isActive = idx === currentStep;
          const isLocked = step.locked;
          const isNext = idx === currentStep + 1;

          return (
            <motion.button
              key={step.key}
              onClick={() => !isLocked && onStepClick?.(idx)}
              disabled={isLocked}
              whileHover={!isLocked ? { scale: 1.08 } : {}}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
              className={cn(
                "relative flex flex-col items-center gap-1.5 flex-1 max-w-[60px] sm:max-w-[80px] transition-all",
                isLocked && "opacity-50 cursor-not-allowed",
                !isLocked && !isActive && "cursor-pointer",
              )}
              aria-label={`${step.label} - ${isCompleted ? "completed" : isActive ? "current" : isLocked ? "locked" : "available"}`}
            >
              {/* Circle indicator - Gestalt: Closure */}
              <motion.div
                className={cn(
                  "relative w-10 h-10 sm:w-12 sm:h-12 rounded-full",
                  "flex items-center justify-center font-bold text-xs sm:text-sm",
                  "transition-all duration-300 ring-offset-2",
                  isCompleted
                    ? "bg-success/20 dark:bg-success/25 text-success dark:text-success/90 ring-2 ring-success/40 dark:ring-success/30"
                    : isActive
                    ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground ring-2 ring-primary/50 dark:ring-primary/40 shadow-lg shadow-primary/30 dark:shadow-primary/20"
                    : isNext
                    ? "bg-primary/15 dark:bg-primary/20 text-primary dark:text-primary/90 ring-1 ring-primary/30 dark:ring-primary/25"
                    : "bg-muted/50 dark:bg-muted/40 text-muted-foreground dark:text-muted-foreground/70",
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.div>
                ) : isLocked ? (
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <span>{idx + 1}</span>
                )}

                {/* Active pulse indicator */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: 1.2, opacity: [1, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  />
                )}
              </motion.div>

              {/* Label - hidden on very small screens */}
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight truncate w-full px-0.5 text-muted-foreground dark:text-muted-foreground/70">
                {step.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Premium Header for Onboarding Pages
 * Theme-aware with semantic colors
 */
export function OnboardingHeader({
  title = "Profile Setup",
  subtitle = "Complete your profile",
  saveState,
  className,
}: {
  title?: string;
  subtitle?: string;
  saveState?: "idle" | "saving" | "saved" | "error";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-50 border-b border-border/50 dark:border-border/30",
        "bg-gradient-to-r from-background via-background to-muted/5",
        "dark:from-background dark:via-background dark:to-muted/5",
        "backdrop-blur-xl supports-[backdrop-filter]:bg-background/95 supports-[backdrop-filter]:dark:bg-background/95",
        "px-4 md:px-6 lg:px-8 py-3 md:py-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 dark:from-primary dark:to-primary/70 flex items-center justify-center">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold text-foreground dark:text-foreground truncate">
              {title}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground/80">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Save status indicator */}
        {saveState && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 flex-shrink-0"
          >
            {saveState === "saving" && (
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-muted-foreground border-t-primary rounded-full"
                />
                <span className="hidden sm:inline">Saving...</span>
              </div>
            )}
            {saveState === "saved" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 text-xs md:text-sm text-success dark:text-success/90"
              >
                <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-success dark:bg-success/90 flex items-center justify-center">
                  <Check className="w-2 h-2 md:w-2.5 md:h-2.5 text-success-foreground" />
                </div>
                <span className="hidden sm:inline">Saved</span>
              </motion.div>
            )}
            {saveState === "error" && (
              <div className="flex items-center gap-2 text-xs md:text-sm text-destructive dark:text-destructive/90">
                <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-destructive dark:bg-destructive/90" />
                <span className="hidden sm:inline">Error</span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * Beautiful step title with icon
 * Gestalt: Proximity grouping of title + description
 */
export function OnboardingStepTitle({
  icon,
  title,
  description,
  required = false,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-3 mb-8">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center text-primary dark:text-primary/90">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground dark:text-foreground">
            {title}
            {required && <span className="text-destructive ml-2 text-base md:text-lg">*</span>}
          </h2>
          {description && (
            <p className="mt-2 text-sm md:text-base text-muted-foreground dark:text-muted-foreground/80 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
