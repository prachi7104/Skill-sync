# SkillSync Token Compliance Reference

## Rule: Never use raw Tailwind color utilities for semantic UI surfaces.

The design token system in `app/globals.css` is the single source of truth
for all colors. Every color in the UI must use a CSS variable token via
a Tailwind utility class that maps to that token.

## Allowed → Forbidden substitution table

| Intent | ✅ Use this | ❌ Never use this |
|---|---|---|
| Page background | `bg-background` | `bg-zinc-50`, `bg-white`, `bg-slate-950`, `bg-zinc-100` |
| Card surface | `bg-card` | `bg-white`, `bg-zinc-50`, `dark:bg-slate-900`, `dark:bg-slate-800` |
| Card foreground | `text-card-foreground` | `text-zinc-900`, `dark:text-slate-100` |
| Body text | `text-foreground` | `text-zinc-900`, `text-zinc-800`, `dark:text-slate-100` |
| Muted/secondary text | `text-muted-foreground` | `text-zinc-500`, `text-zinc-400`, `dark:text-slate-400`, `dark:text-slate-300` |
| Border / divider | `border-border` | `border-zinc-200`, `border-zinc-300`, `dark:border-slate-800`, `dark:border-slate-700` |
| Input border | `border-input` | (same as border) |
| Muted surface | `bg-muted` | `bg-zinc-100`, `bg-zinc-50/50`, `dark:bg-slate-800` |
| Secondary surface | `bg-secondary` | `bg-zinc-100`, `bg-zinc-200` |
| Accent/highlight | `bg-accent` | `bg-zinc-100`, `bg-blue-50` |
| Primary brand | `bg-primary`, `text-primary` | `bg-blue-500`, `text-blue-500`, etc. |

## Landing page EXCEPTION

The public landing page (`app/page.tsx`, `components/landing/`) is exempt
from this rule for components that intentionally do NOT use the app design
system (they use a separate visual language for marketing). Even so, they
must use `dark:` variants consistently.

## How to add a new color

1. Define it as a CSS custom property in `app/globals.css` for both `:root` and `.dark`.
2. Add it to `tailwind.config.ts` color mapping.
3. Use the generated Tailwind class everywhere.
4. Never hardcode an HSL or hex value in a component.

## Enforcement

The `.eslintrc.json` file contains a `tailwindcss/no-contradicting-classname`
rule and a custom forbidden-classname rule that flags the most common violations.
Run `npm run lint` before every commit.
