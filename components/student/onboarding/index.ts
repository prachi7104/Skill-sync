/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Onboarding Components - Central Export
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Re-exports all onboarding components for easy importing
 * 
 * Usage:
 * import { OnboardingLayout, OnboardingCard, ... } from '@/components/student/onboarding'
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

"use client";

// Layout & Container Components
export {
  OnboardingLayout,
  OnboardingCard,
  OnboardingFieldGroup,
  OnboardingInput,
} from "./onboarding-layout";

// Step Components
export {
  PersonalStep,
  AcademicsStep,
  SkillsStep,
  ProjectsStep,
  ExperienceStep,
  AchievementsStep,
} from "./onboarding-steps";

// Action & Navigation Components
export {
  OnboardingActions,
  OnboardingActionsCompact,
} from "./onboarding-actions";

// Visual Components
export {
  OnboardingProgressBar,
  OnboardingHeader,
  OnboardingStepTitle,
} from "./onboarding-visual";

// Design Tokens
export * from "@/lib/design-tokens";

// CSS Module
import styles from "./onboarding.module.css";
export { styles as onboardingStyles };
