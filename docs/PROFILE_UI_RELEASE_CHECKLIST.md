# Profile UI Release Checklist

## Scope
- Student profile responsiveness and shell safe-area behavior.
- Accessibility semantics for profile tab system.
- Dead-code cleanup linked to profile documents flow.

## Completed Gates
- [x] Full test suite green (`npm test -- --run`).
- [x] Profile tab accessibility contract test updated.
- [x] Visual regression snapshots added for profile header + tabs.
- [x] Automated token contrast audit for light/dark themes.
- [x] Mobile QA guardrail tests for overflow and spacing anti-patterns.

## Commands Run
1. `npm test -- --run`
2. `npm run lint -- --file "app/(student)/student/dashboard/page.tsx"`
3. `npm test -- --run tests/unit/theme-contrast-audit.test.ts tests/unit/profile-visual-regression.test.tsx tests/unit/profile-mobile-qa.test.ts`

## Manual Verification Checklist (Final Signoff)
1. Open profile at 320, 360, 375, 390, 414 widths.
2. Validate no clipped completion text in header.
3. Validate all 4 tabs are visible and switchable without horizontal scrolling.
4. Validate edit-mode cards in Skills/Projects/Documents do not overflow horizontally.
5. Validate bottom nav does not overlap scrollable content on student pages.
6. Validate sidebar overlay top inset on notched devices.

## Known Non-Blocking Warnings
- Existing test warning in profile inline validation suite about read-only mock input values.
- Existing Recharts test warning for zero-size chart container in JSDOM.

## Signoff Criteria
- Zero horizontal overflow on profile shell.
- Tab semantics pass screen-reader checks (`tablist`, `tab`, `tabpanel`).
- Contrast audit thresholds pass in both themes.
- Regression tests and snapshots are committed and green.
