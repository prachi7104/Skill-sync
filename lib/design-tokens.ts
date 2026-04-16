/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Onboarding Design Tokens & Style Guide
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Complete design system specification for onboarding UI
 * Includes colors, typography, spacing, shadows, and animations
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * COLOR SYSTEM
 * ════════════════════════════════════════════════════════════════════════════
 */

export const COLORS = {
  // Light Mode
  light: {
    // Primary - Action & Focus
    primary: "#6D28D9", // Vibrant Purple (HSL: 262 80% 50%)
    primaryLight: "#7C3AED", // Lighter purple
    primaryDark: "#5B21B6", // Darker purple
    primaryFaded: "rgba(109, 40, 217, 0.1)",

    // Success - Completion
    success: "#10B981", // Fresh Green (HSL: 142 71% 45%)
    successLight: "#34D399",
    successDark: "#059669",
    successFaded: "rgba(16, 185, 129, 0.1)",

    // Warning - Attention
    warning: "#F59E0B", // Warm Amber (HSL: 38 92% 50%)
    warningLight: "#FBBF24",
    warningDark: "#D97706",
    warningFaded: "rgba(245, 158, 11, 0.1)",

    // Error - Danger
    error: "#EF4444", // Alert Red (HSL: 0 84% 60%)
    errorLight: "#F87171",
    errorDark: "#DC2626",
    errorFaded: "rgba(239, 68, 68, 0.1)",

    // Neutral
    background: "#FFFFFF",
    foreground: "#0F172A",
    muted: "#F1F5F9",
    mutedForeground: "#64748B",
    border: "#E2E8F0",
    card: "#FFFFFF",
    input: "#E2E8F0",
  },

  // Dark Mode
  dark: {
    primary: "#A78BFA", // Lighter purple for dark
    primaryLight: "#C4B5FD",
    primaryDark: "#7C3AED",
    primaryFaded: "rgba(167, 139, 250, 0.15)",

    success: "#6EE7B7", // Lighter green
    successLight: "#A7F3D0",
    successDark: "#10B981",
    successFaded: "rgba(110, 231, 183, 0.15)",

    warning: "#FCD34D", // Lighter amber
    warningLight: "#FDE68A",
    warningDark: "#F59E0B",
    warningFaded: "rgba(252, 211, 77, 0.15)",

    error: "#F87171", // Lighter red
    errorLight: "#FCA5A5",
    errorDark: "#EF4444",
    errorFaded: "rgba(248, 113, 113, 0.15)",

    background: "#0F172A",
    foreground: "#F1F5F9",
    muted: "#1E293B",
    mutedForeground: "#94A3B8",
    border: "#334155",
    card: "#1A202C",
    input: "#1E293B",
  },
};

/**
 * TYPOGRAPHY SYSTEM
 * ════════════════════════════════════════════════════════════════════════════
 */

export const TYPOGRAPHY = {
  // Font Families
  fonts: {
    sans: 'system-ui, -apple-system, sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
  },

  // Font Sizes & Line Heights
  scales: {
    xs: { size: "0.75rem", height: "1rem", weight: 400 }, // 12px
    sm: { size: "0.875rem", height: "1.25rem", weight: 400 }, // 14px
    base: { size: "1rem", height: "1.5rem", weight: 400 }, // 16px
    lg: { size: "1.125rem", height: "1.75rem", weight: 500 }, // 18px
    xl: { size: "1.25rem", height: "1.75rem", weight: 600 }, // 20px
    "2xl": { size: "1.5rem", height: "2rem", weight: 600 }, // 24px
    "3xl": { size: "1.875rem", height: "2.25rem", weight: 700 }, // 30px
    "4xl": { size: "2.25rem", height: "2.5rem", weight: 700 }, // 36px
  },

  // Headings
  headings: {
    h1: { size: "2.25rem", weight: 700, lineHeight: "2.5rem", tracking: "-0.02em" },
    h2: { size: "1.875rem", weight: 700, lineHeight: "2.25rem", tracking: "-0.015em" },
    h3: { size: "1.5rem", weight: 600, lineHeight: "2rem", tracking: "-0.01em" },
    h4: { size: "1.25rem", weight: 600, lineHeight: "1.75rem" },
    h5: { size: "1.125rem", weight: 600, lineHeight: "1.75rem" },
    h6: { size: "1rem", weight: 600, lineHeight: "1.5rem" },
  },

  // Labels & Body
  labels: {
    large: { size: "0.875rem", weight: 500, tracking: "0.005em" },
    medium: { size: "0.75rem", weight: 500, tracking: "0.01em" },
    small: { size: "0.625rem", weight: 600, tracking: "0.15em", upper: true },
  },

  body: {
    large: { size: "1rem", weight: 400, lineHeight: "1.625rem" },
    default: { size: "0.875rem", weight: 400, lineHeight: "1.5rem" },
    small: { size: "0.8125rem", weight: 400, lineHeight: "1.375rem" },
  },
};

/**
 * SPACING SYSTEM
 * ════════════════════════════════════════════════════════════════════════════
 * Based on 4px base unit
 */

export const SPACING = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
};

/**
 * SHADOWS
 * ════════════════════════════════════════════════════════════════════════════
 */

export const SHADOWS = {
  // Elevation System
  none: "none",
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",

  // Component Shadows
  input: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  card: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
  elevated: "0 4px 12px 0 rgb(0 0 0 / 0.1)",
  floating: "0 10px 25px 0 rgb(0 0 0 / 0.15)",
};

/**
 * BORDER RADIUS
 * ════════════════════════════════════════════════════════════════════════════
 */

export const RADIUS = {
  none: "0",
  sm: "0.375rem", // 6px
  md: "0.5rem", // 8px
  lg: "0.75rem", // 12px
  xl: "1rem", // 16px
  "2xl": "1.5rem", // 24px
  "3xl": "2rem", // 32px
  full: "9999px",
};

/**
 * TRANSITIONS & ANIMATIONS
 * ════════════════════════════════════════════════════════════════════════════
 */

export const ANIMATIONS = {
  // Easing Functions
  easing: {
    ease: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  // Durations
  durations: {
    shortest: "150ms",
    short: "200ms",
    standard: "300ms",
    long: "400ms",
    longer: "600ms",
  },

  // Keyframes
  keyframes: {
    slideInUp: `
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(1rem);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
    fadeIn: `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,
    pulseRing: `
      @keyframes pulseRing {
        0% {
          box-shadow: 0 0 0 0 currentColor;
        }
        70% {
          box-shadow: 0 0 0 6px rgba(currentColor, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(currentColor, 0);
        }
      }
    `,
    shimmer: `
      @keyframes shimmer {
        0% {
          background-position: -1000px 0;
        }
        100% {
          background-position: 1000px 0;
        }
      }
    `,
  },
};

/**
 * COMPONENT SPECIFICATIONS
 * ════════════════════════════════════════════════════════════════════════════
 */

export const COMPONENTS = {
  // Input Fields
  input: {
    height: "2.625rem", // 42px
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    borderRadius: "0.5rem",
    transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    focus: {
      ring: "2px",
      ringColor: "primary",
      ringOpacity: 0.5,
    },
  },

  // Buttons
  button: {
    padding: {
      sm: "0.625rem 1rem",
      md: "0.75rem 1.25rem",
      lg: "1rem 1.5rem",
    },
    height: {
      sm: "2rem",
      md: "2.5rem",
      lg: "3rem",
    },
    borderRadius: "0.5rem",
    transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    hover: {
      transform: "translateY(-2px)",
    },
    active: {
      transform: "translateY(0)",
    },
  },

  // Cards
  card: {
    borderRadius: "1.5rem",
    padding: {
      mobile: "1.5rem",
      tablet: "2rem",
      desktop: "2.5rem",
    },
    border: "1px solid",
    borderColor: "border",
    backdropFilter: "blur(10px)",
  },

  // Progress Bar
  progressBar: {
    height: "0.5rem",
    borderRadius: "0.25rem",
    backgroundColor: "muted",
    fillGradient: "linear-gradient(90deg, primary, primary/0.7)",
    transition: "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  // Step Indicator
  stepIndicator: {
    size: {
      sm: "2rem",
      md: "2.5rem",
      lg: "3rem",
    },
    borderRadius: "50%",
    fontSize: "0.875rem",
    fontWeight: 600,
  },
};

/**
 * RESPONSIVE BREAKPOINTS
 * ════════════════════════════════════════════════════════════════════════════
 */

export const BREAKPOINTS = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

/**
 * Z-INDEX SCALE
 * ════════════════════════════════════════════════════════════════════════════
 */

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

/**
 * ACCESSIBILITY
 * ════════════════════════════════════════════════════════════════════════════
 */

export const ACCESSIBILITY = {
  // Focus states
  focus: {
    outline: "2px solid",
    outlineColor: "primary",
    outlineOffset: "2px",
  },

  // High contrast mode
  hc: {
    borderWidth: "2px",
    outline: "3px solid",
  },

  // Reduced motion
  prefersReducedMotion: "prefers-reduced-motion: reduce",
};

/**
 * USAGE EXAMPLE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * import { COLORS, TYPOGRAPHY, SPACING, ANIMATIONS } from './tokens'
 *
 * const styles = {
 *   title: {
 *     fontSize: TYPOGRAPHY.headings.h2.size,
 *     fontWeight: TYPOGRAPHY.headings.h2.weight,
 *     color: COLORS.light.foreground,
 *     marginBottom: SPACING[4],
 *   },
 *   button: {
 *     padding: COMPONENTS.button.padding.md,
 *     backgroundColor: COLORS.light.primary,
 *     transition: ANIMATIONS.durations.short + ' ' + ANIMATIONS.easing.easeOut,
 *   },
 * }
 */

const DESIGN_TOKENS = {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  RADIUS,
  ANIMATIONS,
  COMPONENTS,
  BREAKPOINTS,
  Z_INDEX,
  ACCESSIBILITY,
};

export default DESIGN_TOKENS;
