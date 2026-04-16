# Onboarding UI - Premium Design System

## Overview

A beautiful, production-grade onboarding interface built on **Gestalt principles** with full theme support (light/dark modes) and comprehensive responsiveness for all device layouts.

## Design Principles (Gestalt-Based)

### 1. **Proximity**
   - Related form fields grouped in columns (2-3 columns responsive)
   - Steps grouped in navigation sidebar
   - Dividers separate logical sections

### 2. **Similarity**
   - All step indicators use consistent styling
   - Input fields share semantic styling
   - Alert messages use consistent patterns

### 3. **Continuity**
   - Progress bar shows continuous visual flow
   - Connecting lines between sidebar steps
   - Animated transitions guide user attention

### 4. **Closure**
   - Step circles filled when completed (✓)
   - Active step has ring/pulse effect
   - Locked steps show lock icon inside circle

### 5. **Figure-Ground**
   - Clear separation between sidebar and content
   - Cards have distinct backgrounds with subtle gradients
   - Active elements pop with shadows and colors

## Components

### `OnboardingLayout`
Master layout component managing responsive grid and sidebar.

```tsx
<OnboardingLayout
  steps={steps}
  currentStepKey="identity"
  onStepClick={(key) => setActiveStep(key)}
  showProgress
>
  {children}
</OnboardingLayout>
```

**Features:**
- Sidebar: Hidden on mobile, sticky on desktop
- Responsive grid: 1-2-3 column layout
- Progress bar at top
- Top-to-bottom flow on mobile

### `OnboardingCard`
Content container with icon, title, and description.

```tsx
<OnboardingCard
  title="Personal Information"
  description="Add your university IDs..."
  icon={<User className="w-6 h-6" />}
  required
>
  {/* form fields */}
</OnboardingCard>
```

### `OnboardingFieldGroup`
Grid wrapper for responsive field layouts.

```tsx
<OnboardingFieldGroup cols={2}>
  <OnboardingInput label="SAP ID" placeholder="60091234" />
  <OnboardingInput label="Roll No" placeholder="A01" />
</OnboardingFieldGroup>
```

### `OnboardingInput`
Enhanced input with label, error state, and helper text.

```tsx
<OnboardingInput
  label="Email"
  type="email"
  placeholder="student@upes.ac.in"
  required
  error={false}
  helperText="We'll use this for verification"
/>
```

### `OnboardingActions`
Navigation buttons (Previous, Skip, Next, Complete).

```tsx
<OnboardingActions
  onPrevious={() => setStep(prev - 1)}
  onNext={() => setStep(next + 1)}
  onComplete={() => finish()}
  canGoPrevious={currentStep > 0}
  canGoNext={formValid}
  isLoading={saving}
  isFinal={currentStep === totalSteps - 1}
/>
```

### `OnboardingProgressBar`
Animated progress indicator with step dots.

```tsx
<OnboardingProgressBar
  currentStep={2}
  totalSteps={6}
  steps={[
    { key: 'identity', label: 'Personal', completed: true, locked: false },
    // ...
  ]}
  onStepClick={(idx) => setStep(idx)}
/>
```

### `OnboardingHeader`
Premium sticky header with branding and save status.

```tsx
<OnboardingHeader
  title="Profile Setup"
  subtitle="Complete your profile"
  saveState="saved"
/>
```

### `OnboardingStepTitle`
Styled title with icon and description.

```tsx
<OnboardingStepTitle
  icon={<GraduationCap className="w-6 h-6" />}
  title="Academic Details"
  description="Help us understand your educational background"
  required
/>
```

## Styling System

### CSS Classes
Located in `onboarding.module.css`:

```css
/* Layout */
.onboarding-layout
.onboarding-sidebar
.onboarding-content

/* Components */
.onboarding-card
.onboarding-input
.onboarding-button
.onboarding-step-item
.onboarding-step-indicator

/* Utilities */
.onboarding-field-group
.onboarding-progress-bar
.onboarding-alert
.onboarding-divider

/* Animations */
.onboarding-animate-in
.onboarding-pulse-ring
```

### Design Tokens

Light Mode:
```css
--primary: 262 80% 50%        /* Vibrant purple */
--success: 142 71% 45%        /* Fresh green */
--warning: 38 92% 50%         /* Warm orange */
--destructive: 0 84% 60%      /* Alert red */
--background: 0 0% 100%       /* Clean white */
--foreground: 222 84% 5%      /* Dark text */
--muted: 210 40% 96%          /* Light gray */
```

Dark Mode:
```css
--primary: 262 80% 50%        /* Same purple */
--background: 222 84% 5%      /* Near black */
--foreground: 0 0% 95%        /* Light text */
--muted: 217 33% 17%          /* Dark gray */
```

## Responsive Breakpoints

| Device | Layout | Grid | Sidebar |
|--------|--------|------|---------|
| Mobile (<640px) | Full width | 1 col | Hidden |
| Tablet (640-1023px) | Full width | 2 cols | Hidden |
| Desktop (1024px+) | 3-col (sidebar + content) | 3 cols | Visible |
| Large (1280px+) | Wider grid with max-width | 3-4 cols | Wider |

## Theme Support

All components work seamlessly with light and dark modes:

```tsx
// Auto-detects system preference
// Respects user's theme setting
// Smooth transitions between themes
```

**Colors adapt automatically:**
- Backgrounds: White → Near black
- Text: Dark → Light
- Shadows: Subtle adjustments for visibility
- Accents: Same hue, adjusted lightness

## Animations

### Transitions
- **Smooth:** 150ms cubic-bezier for interactions
- **Spring:** 400ms spring curves for modals/entries
- **Pulse:** 2s infinite for active states

### Keyframes
- `slide-in-up`: Card entries
- `fade-in`: Element visibility
- `pulse-ring`: Active step indicator

### Motion
- Step changes: Fade + Y translation
- Button hovers: Scale + shadow elevation
- Progress: Elastic easing for fills

## Accessibility

✓ ARIA labels on all interactive elements
✓ Keyboard navigation support
✓ High contrast ratios (WCAG AA+)
✓ Focus visible states
✓ Screen reader friendly
✓ Semantic HTML structure

## Example Implementation

```tsx
import {
  OnboardingLayout,
  OnboardingCard,
  OnboardingFieldGroup,
  OnboardingInput,
  OnboardingActions,
} from "@/components/student/onboarding";

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});

  const steps = [
    {
      key: "identity",
      label: "Personal",
      description: "Your university IDs",
      completed: false,
      locked: false,
    },
    // ...
  ];

  return (
    <OnboardingLayout
      steps={steps}
      currentStepKey={steps[step].key}
      onStepClick={(key) => setStep(steps.findIndex(s => s.key === key))}
    >
      <OnboardingCard
        title="Personal Information"
        description="Add your university IDs and contact info"
        icon={<User className="w-6 h-6" />}
        required
      >
        <OnboardingFieldGroup cols={2}>
          <OnboardingInput
            label="SAP ID"
            placeholder="60091234"
            required
            error={form.sapId === ""}
            helperText="Found on your student ID"
          />
          <OnboardingInput
            label="Roll Number"
            placeholder="A01"
            required
          />
        </OnboardingFieldGroup>

        <OnboardingActions
          onNext={() => setStep(step + 1)}
          onPrevious={() => setStep(step - 1)}
          canGoNext={form.sapId && form.rollNo}
          canGoPrevious={step > 0}
        />
      </OnboardingCard>
    </OnboardingLayout>
  );
}
```

## Performance Optimizations

✓ Memoized components
✓ Lazy-loaded step content
✓ Efficient animations (transform/opacity only)
✓ Minimal re-renders with proper dependencies
✓ Optimized CSS (critical path inlined)

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | Latest | ✓ Full |
| Firefox | Latest | ✓ Full |
| Safari | 14+ | ✓ Full |
| Edge | Latest | ✓ Full |
| Mobile | iOS 12+, Android 8+ | ✓ Full |

## Future Enhancements

- [ ] Resume autofill animations
- [ ] Step-specific error messages
- [ ] Conditional field visibility
- [ ] Form validation feedback
- [ ] Progress persistence (local storage)
- [ ] Export/import functionality
- [ ] Analytics integration

## File Structure

```
components/student/onboarding/
├── onboarding-layout.tsx      # Main layout + container
├── onboarding-steps.tsx       # Step-specific components
├── onboarding-actions.tsx     # Navigation buttons
├── onboarding-visual.tsx      # Progress bar + header
└── onboarding.module.css      # Styling system
```

## Credits

Designed with Gestalt principles and modern UI/UX best practices.
Theme system built on semantic tokens for consistency.
Animations optimized for 60fps performance.
