/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Onboarding Action Buttons - Step Navigation
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Beautiful navigation controls for onboarding flow
 * Handles Previous, Next, Skip, and Complete actions
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingActionsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  onComplete?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  canSkip?: boolean;
  isLoading?: boolean;
  isFinal?: boolean;
  showSkip?: boolean;
}

export function OnboardingActions({
  onPrevious,
  onNext,
  onSkip,
  onComplete,
  canGoPrevious = false,
  canGoNext = true,
  canSkip = true,
  isLoading = false,
  isFinal = false,
  showSkip = true,
}: OnboardingActionsProps) {
  return (
    <div className="mt-12 md:mt-16 lg:mt-20 pt-8 md:pt-12 border-t border-border/50 dark:border-border/30">
      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4">
        {/* Left actions */}
        <div className="flex gap-3">
          {canGoPrevious && (
            <motion.button
              whileHover={{ x: -2 }}
              whileTap={{ x: -4 }}
              onClick={onPrevious}
              disabled={isLoading}
              className={cn(
                "inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3",
                "rounded-lg border border-border dark:border-border/50",
                "bg-background dark:bg-background text-foreground dark:text-foreground",
                "font-medium text-sm md:text-base transition-all duration-200",
                "hover:bg-muted dark:hover:bg-muted/50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </motion.button>
          )}

          {showSkip && !isFinal && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSkip}
              disabled={!canSkip || isLoading}
              className={cn(
                "inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3",
                "rounded-lg border border-border/50 dark:border-border/30",
                "bg-muted/40 dark:bg-muted/20 text-muted-foreground dark:text-muted-foreground/80",
                "font-medium text-sm md:text-base transition-all duration-200",
                "hover:bg-muted dark:hover:bg-muted/30 hover:text-foreground dark:hover:text-foreground",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Skip
            </motion.button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex gap-3 justify-end md:justify-start">
          {!isFinal ? (
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ x: 4 }}
              onClick={onNext}
              disabled={!canGoNext || isLoading}
              className={cn(
                "inline-flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3",
                "rounded-lg bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground",
                "font-semibold text-sm md:text-base transition-all duration-200",
                "hover:bg-primary/90 dark:hover:bg-primary/90 shadow-lg shadow-primary/25 dark:shadow-primary/15",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                isLoading && "opacity-75"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Next Step</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onComplete}
              disabled={isLoading}
              className={cn(
                "inline-flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3",
                "rounded-lg bg-success dark:bg-success text-success-foreground dark:text-success-foreground",
                "font-semibold text-sm md:text-base transition-all duration-200",
                "hover:bg-success/90 dark:hover:bg-success/90 shadow-lg shadow-success/25 dark:shadow-success/15",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                isLoading && "opacity-75"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Completing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Complete Setup</span>
                  <span className="sm:hidden">Done</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Help text */}
      <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground/70 text-center mt-6 md:mt-8">
        You can always edit your profile later from the profile tab
      </p>
    </div>
  );
}

/**
 * Compact action buttons for mobile (condensed version)
 */
export function OnboardingActionsCompact({
  onNext,
  onPrevious,
  canGoPrevious = false,
  canGoNext = true,
  isLoading = false,
  isFinal = false,
}: Omit<OnboardingActionsProps, "showSkip" | "canSkip" | "onSkip">) {
  return (
    <div className="flex gap-2 md:gap-3 mt-8">
      {canGoPrevious && (
        <button
          onClick={onPrevious}
          disabled={isLoading}
          className={cn(
            "flex-shrink-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg",
            "border border-border dark:border-border/50 bg-background dark:bg-background",
            "text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted/50",
            "disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        className={cn(
          "flex-1 px-4 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base",
          "transition-all duration-200 flex items-center justify-center gap-2",
          isFinal
            ? "bg-success dark:bg-success text-success-foreground dark:text-success-foreground hover:bg-success/90 dark:hover:bg-success/90 shadow-lg shadow-success/25 dark:shadow-success/15"
            : "bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/90 shadow-lg shadow-primary/25 dark:shadow-primary/15",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFinal ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete</span>
          </>
        ) : (
          <>
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
