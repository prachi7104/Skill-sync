// ─── Shell dimensions ──────────────────────────────────────────────────────────
// These values are the source of truth for the shell layout grid.
// If you change any value here, update the corresponding Tailwind class in the
// relevant layout file (app/(admin)/layout.tsx etc.) to match.

export const HEADER_HEIGHT = 56;            // px — h-14 in Tailwind
export const HEADER_HEIGHT_CLASS = 'h-14'; // Tailwind class

export const SIDEBAR_WIDTH_EXPANDED = 200;  // px — w-[200px]
export const SIDEBAR_WIDTH_COLLAPSED = 64;  // px — w-16
export const SIDEBAR_WIDTH_EXPANDED_CLASS = 'w-[200px]';
export const SIDEBAR_WIDTH_COLLAPSED_CLASS = 'w-16';

// ─── Breakpoints (match tailwind.config.ts screens) ───────────────────────────
export const BREAKPOINT_XS = 375;
export const BREAKPOINT_SM = 640;
export const BREAKPOINT_MD = 768;   // sidebar appears above this
export const BREAKPOINT_LG = 1024;
export const BREAKPOINT_XL = 1280;

// ─── Content padding ──────────────────────────────────────────────────────────
export const CONTENT_PADDING_X = 'px-4 sm:px-6';  // applied to main content wrapper
export const CONTENT_PADDING_Y = 'py-6';

// ─── Z-index scale ────────────────────────────────────────────────────────────
export const Z_HEADER = 50;       // sticky header
export const Z_SIDEBAR = 40;      // sidebar (below header)
export const Z_MOBILE_DRAWER = 60; // mobile nav drawer (above header)
export const Z_MODAL = 70;        // dialogs and modals
export const Z_TOAST = 80;        // toast notifications

// ─── Animation durations (ms) ─────────────────────────────────────────────────
export const SIDEBAR_ANIM_MS = 250;   // sidebar expand/collapse
export const PAGE_ANIM_MS = 350;      // page-level entrance
export const HOVER_ANIM_MS = 150;     // hover state transitions
