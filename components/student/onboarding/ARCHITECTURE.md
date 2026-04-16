# Onboarding UI - Component Architecture

## Component Hierarchy

```
OnboardingLayout (Master Container)
├── OnboardingHeader (Sticky Header)
│   ├── Branding Section
│   │   └── Icon + Title + Subtitle
│   └── Save Status Indicator
│       ├── Saving State
│       ├── Saved State
│       └── Error State
│
├── Sidebar Navigation (Desktop Only)
│   └── Step Items (Repeating)
│       ├── Step Indicator (Circle)
│       │   ├── Number (Pending)
│       │   ├── Check Icon (Completed)
│       │   ├── Lock Icon (Locked)
│       │   └── Pulse Ring (Active)
│       └── Step Label
│
└── Content Area
    ├── OnboardingProgressBar
    │   ├── Progress Track (Visual)
    │   └── Step Indicators (Bottom)
    │       ├── Step Dot (Completed)
    │       ├── Step Dot (Active)
    │       └── Step Dot (Pending/Locked)
    │
    ├── OnboardingCard
    │   ├── Card Header
    │   │   ├── Icon Section
    │   │   ├── Title
    │   │   ├── Description
    │   │   └── Required Indicator
    │   │
    │   └── Card Content
    │       ├── OnboardingStepTitle
    │       │   ├── Icon
    │       │   ├── Title
    │       │   ├── Description
    │       │   └── Required Badge
    │       │
    │       ├── OnboardingFieldGroup (Cols: 1|2|3)
    │       │   ├── OnboardingInput
    │       │   │   ├── Label
    │       │   │   ├── Input Field
    │       │   │   ├── Error State
    │       │   │   ├── Error Message
    │       │   │   └── Helper Text
    │       │   └── OnboardingInput (Repeating)
    │       │
    │       ├── OnboardingDivider
    │       └── OnboardingFieldGroup (Repeating)
    │
    └── OnboardingActions
        ├── Previous Button
        ├── Skip Button
        ├── Next Button
        └── Complete Button (on final step)
```

## Component Dependency Graph

```
┌─────────────────────────────────────────────┐
│         OnboardingLayout (Container)        │
└─────────────────────────────────────────────┘
              │
    ┌─────────┼─────────┬──────────┐
    │         │         │          │
    ▼         ▼         ▼          ▼
┌─────────┐ ┌────────┐ ┌────────┐ ┌─────────────┐
│ Header  │ │Progress│ │ Cards  │ │  Actions    │
│         │ │  Bar   │ │        │ │  Buttons    │
└─────────┘ └────────┘ └────────┘ └─────────────┘
    │           │          │           │
    │           │          │           │
    ├─ Branding │   Steps  ├─ Input   └─ Navigation
    ├─ Status   │   (1-6)  ├─ Title
    └─ Icon     │          ├─ Divider
                │          └─ FieldGroup
                │
                ├─ Filled (Completed)
                ├─ Active (Current)
                ├─ Pending (Available)
                └─ Locked (Disabled)
```

## Data Flow

```
User Action
    │
    ▼
OnboardingLayout (manages currentStepKey)
    │
    ├─ Route to correct step component
    │
    ▼
OnboardingCard (displays step content)
    │
    ├─ OnboardingStepTitle (displays info)
    │
    ├─ OnboardingFieldGroup (layout)
    │   │
    │   └─ OnboardingInput (form field)
    │       │
    │       └─ User enters data
    │           │
    │           ▼
    │       Validation (React Hook Form)
    │           │
    │           ├─ Valid: Error clears
    │           │
    │           └─ Invalid: Error shows
    │
    └─ OnboardingActions (navigation)
        │
        └─ Previous/Next/Complete
            │
            ▼
        Update step / Trigger save
            │
            ▼
        Auto-save to API (sanitized)
            │
            ▼
        Update OnboardingHeader (save status)
```

## Responsive Layout Flow

### Mobile (< 640px)
```
┌─────────────────────┐
│   OnboardingHeader  │
├─────────────────────┤
│  OnboardingProgress │
│       (Hidden)      │
├─────────────────────┤
│                     │
│  OnboardingCard     │
│  (Full Width)       │
│                     │
│  - 1 Column Form    │
│  - Stacked Fields   │
│                     │
├─────────────────────┤
│ OnboardingActions   │
│ (Vertical Stack)    │
└─────────────────────┘
```

### Tablet (640px - 1023px)
```
┌──────────────────────────────┐
│      OnboardingHeader        │
├──────────────────────────────┤
│   OnboardingProgressBar      │
├──────────────────────────────┤
│                              │
│     OnboardingCard           │
│     (Full Width)             │
│                              │
│  - 2 Column Form Layout      │
│  - Side-by-side Fields       │
│                              │
├──────────────────────────────┤
│    OnboardingActions         │
└──────────────────────────────┘
```

### Desktop (1024px+)
```
┌────────────────────────────────────────────────────────┐
│                  OnboardingHeader                      │
├────────────────────────────────────────────────────────┤
│                 OnboardingProgressBar                  │
├────────┬────────────────────────────────────────────────┤
│        │                                               │
│Sidebar │    OnboardingCard (3 Col Forms)              │
│  Nav   │                                               │
│        │    - 3 Column Fields                          │
│(Sticky)│    - Balanced Layout                          │
│        │    - Sidebar Visible                          │
│        ├────────────────────────────────────────────────┤
│        │          OnboardingActions                     │
├────────┴────────────────────────────────────────────────┤
└────────────────────────────────────────────────────────┘
```

## State Management Flow

```
User Interaction
        │
        ▼
React State (activeStep)
        │
    ┌───┴───┐
    │       │
    ▼       ▼
Local    URL
Form     State
State    (Deep Link)
    │       │
    └───┬───┘
        │
        ▼
Component Re-render
    (OnboardingLayout updates sidebar)
        │
        ▼
Display Step Content
        │
        └─► OnboardingProgressBar updates
        │
        └─► OnboardingCard shows new step
        │
        └─► OnboardingHeader may update status
```

## Theme Application Flow

```
System Preference
  or
User Override
        │
        ▼
Theme Provider (next-themes)
        │
        ▼
CSS Variables Update
        │
    ┌───┴───┐
    │       │
    ▼       ▼
Light   Dark
Theme   Theme
        │
        ▼
All Components
(Automatic color adaptation)
    │
    └─► Backgrounds
    ├─► Text colors
    ├─► Border colors
    ├─► Shadow colors
    └─► Animation colors
```

## Animation Timeline

```
Step Change
    │
    ├─► Card: fadeIn + slideInUp (400ms spring)
    │
    ├─► Progress Bar: animated fill (800ms elastic)
    │
    ├─► Step Indicators: pulse effect (2s infinite)
    │
    ├─► Active Step: scale animation (150ms easeOut)
    │
    └─► Check Icon: rotate + scale (300ms spring)
```

## Gesture & Interaction Flow

```
User Action                   Component Response
───────────────────────────────────────────────

Tab Focus                     Focus ring appears (2px primary)
    │
    ▼

Button Hover                  Scale + Shadow lift (150ms)
    │
    ▼

Button Click                  Tap animation (scale 0.95)
    │
    ▼

Form Input Focus              Ring highlights field
    │
    ▼

Form Input Blur               Validation triggers
    │
    ▼

Form Input Error              Red border + alert icon
    │
    ▼

Form Submission               Loading spinner (1.5s rotate)
    │
    ▼

Success                       Green check (300ms spring)
    │
    ▼

Theme Toggle                  Fade + color update (300ms)
```

## Performance Optimizations

```
Component Tree
    │
    ├─► React.memo() on all components
    │   └─ Prevents unnecessary re-renders
    │
    ├─► useCallback() for event handlers
    │   └─ Stable function references
    │
    ├─► useMemo() for computed values
    │   └─ Expensive calculations cached
    │
    ├─► Dynamic imports for heavy components
    │   └─ Code splitting enabled
    │
    ├─► CSS Modules tree-shaking
    │   └─ Unused styles removed in prod
    │
    └─► GPU-accelerated animations
        └─ transform/opacity only (no repaints)
```

## Error Handling Flow

```
User Input
    │
    ▼
Form Validation
    │
    ├─► Valid ✓
    │   └─ Enable Next button
    │   └─ Clear error messages
    │
    └─► Invalid ✗
        └─ Show error on field
        └─ Highlight in red
        └─ Display error message
        └─ Disable Next button
        └─ Keep focus on field

Form Submission
    │
    ├─► Sanitization (trim, filter blanks)
    │
    ├─► API PATCH Request
    │   │
    │   ├─► Success ✓
    │   │   └─ Update OnboardingHeader: "Saved"
    │   │   └─ Proceed to next step
    │   │
    │   └─► Failure ✗
    │       └─ Update OnboardingHeader: "Error"
    │       └─ Show error toast
    │       └─ Keep user on step
    │       └─ Show retry button
    │
    └─► Auto-save on blur (debounced 1200ms)
```

## Testing Structure

```
test/
├── unit/
│   └─► profile-sanitizer.test.ts (40 tests)
│       └─ String trimming
│       └─ Array filtering
│       └─ Idempotency
│
├── integration/
│   ├─► profile-save-sanitization.test.ts (55 tests)
│   │   └─ Full save flow
│   │   └─ Optional vs required fields
│   │   └─ Defensive API sanitization
│   │
│   ├─► profile-tab-url-state.test.ts (30 tests)
│   │   └─ Tab persistence
│   │   └─ Deep linking
│   │   └─ Browser navigation
│   │
│   └─► profile-inline-validation.test.ts (30 tests)
│       └─ Field validation
│       └─ Error display
│       └─ Form submission
│
└─► Total: 210+ tests ✓
```

## File Structure

```
components/student/onboarding/
├── index.ts                    ← Central export (50 lines)
├── onboarding-layout.tsx       ← Master layout + containers (400 lines)
├── onboarding-steps.tsx        ← 6 step components (300 lines)
├── onboarding-actions.tsx      ← Navigation buttons (200 lines)
├── onboarding-visual.tsx       ← Progress/header/title (380 lines)
├── onboarding.module.css       ← Complete styling (500+ lines)
├── README.md                   ← API documentation (250+ lines)
├── INTEGRATION.md              ← Integration guide (300+ lines)
├── SYSTEM.md                   ← System overview (400+ lines)
└── QA-CHECKLIST.md             ← QA & deployment (300+ lines)

lib/
├── design-tokens.ts            ← Design system (400+ lines)
└── profile/
    └── sanitize.ts             ← Sanitization (570 lines)
```

## Key Integration Points

```
App Router
    │
    ├─► app/(student)/student/onboarding/page.tsx
    │   └─ Import OnboardingLayout, OnboardingCard, OnboardingInput
    │   └─ Wrap existing step components
    │   └─ Add OnboardingHeader + OnboardingProgressBar
    │   └─ Add OnboardingActions for navigation
    │
    └─► app/api/student/profile/route.ts (PATCH)
        └─ Already has sanitizeProfilePayload()
        └─ Returns data to onboarding page
        └─ Triggers OnboardingHeader status update

Database (Drizzle)
    │
    └─► Receives sanitized, validated data
        └─ No blank rows reach DB
        └─ Consistent data quality

Redis/Cache
    │
    └─► Optional caching layer
        └─ Profile data cached
        └─ Auto-save optimization
```

## Deployment Architecture

```
Code Repository
    │
    ├─► Git commit + push
    │
    └─► CI/CD Pipeline
        │
        ├─► Linting (ESLint)
        ├─► Type checking (TypeScript)
        ├─► Testing (Vitest, 210+ tests)
        ├─► Building (Next.js)
        │
        ├─► Staging Deployment
        │   └─ Full QA testing
        │
        └─► Production Deployment
            ├─ Monitoring alerts
            ├─ Error tracking
            ├─ Performance monitoring
            └─ User analytics
```

---

This architecture ensures scalability, maintainability, and optimal performance across all devices and network conditions.
