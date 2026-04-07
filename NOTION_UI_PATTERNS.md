# SkillSync Notion UI — Component Pattern Reference

This is the quick-reference card for any new component written after the overhaul.
When building any new UI, answer "which pattern does this map to?" and copy the snippet.

---

## Page Container

```tsx
// Standard page (lists, dashboards)
<div className="max-w-5xl mx-auto px-8 py-10 space-y-8 animate-fade-up">

// Document page (resume viewer, JD viewer, settings)
<div className="max-w-3xl mx-auto px-8 py-10 space-y-0">
```

---

## Page Header

```tsx
// Without action button
<div>
  <h1 className="text-2xl font-semibold text-foreground">Page Title</h1>
  <p className="text-sm text-muted-foreground mt-1">Optional subtitle.</p>
</div>

// With action button
<div className="flex items-start justify-between gap-4">
  <div>
    <h1 className="text-2xl font-semibold text-foreground">Page Title</h1>
    <p className="text-sm text-muted-foreground mt-1">Optional subtitle.</p>
  </div>
  <Button>
    <Plus className="w-4 h-4" strokeWidth={1.5} />
    New Item
  </Button>
</div>
```

---

## Section Divider

```tsx
<Separator className="my-0" />  {/* Use with space-y-8 parent — gap handled by parent */}
```

---

## Stat Cards (4-up grid)

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
  {stats.map(({ label, value }) => (
    <div key={label} className="rounded-md border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground mt-1">{value}</p>
    </div>
  ))}
</div>
```

---

## Card (generic bordered box)

```tsx
// Using shadcn Card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// Raw div when Card is overkill
<div className="rounded-md border border-border bg-card p-5">
  {/* content */}
</div>
```

---

## Table

```tsx
<div className="rounded-md border border-border overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border bg-secondary">
          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Column</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.id} className={cn("border-b border-border last:border-0 hover:bg-accent transition-colors", i % 2 !== 0 && "bg-secondary/30")}>
            <td className="px-4 py-2.5 text-sm text-foreground">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## Form Field

```tsx
<div className="space-y-1.5">
  <Label className="text-xs font-medium text-muted-foreground">Field Label</Label>
  <Input placeholder="..." {...register("fieldName")} />
  {errors.fieldName && (
    <p className="text-xs text-destructive">{errors.fieldName.message}</p>
  )}
</div>
```

---

## Form Field Group (section of related fields)

```tsx
<div className="space-y-4">
  <h3 className="text-sm font-semibold text-foreground">Section Name</h3>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* fields */}
  </div>
</div>
```

---

## Settings Row

```tsx
// Use in a space-y-0 container with border-b border-border on each row
<div className="py-4 border-b border-border flex items-start justify-between gap-8">
  <div>
    <p className="text-sm font-medium text-foreground">Setting Name</p>
    <p className="text-xs text-muted-foreground mt-0.5">Description of what this controls.</p>
  </div>
  <Button variant="outline" size="sm">Action</Button>
</div>
```

---

## Badge Usage Guide

```tsx
<Badge>Default gray</Badge>
<Badge variant="blue">Status / Info</Badge>
<Badge variant="green">Active / Success / Eligible</Badge>
<Badge variant="yellow">Warning / Pending</Badge>
<Badge variant="red">Error / Inactive / Ineligible</Badge>
<Badge variant="purple">Special / Admin</Badge>
<Badge variant="outline">Subtle / Neutral</Badge>
<Badge variant="destructive">Destructive action label</Badge>

// Skill/technology tags — use default with font-mono
<Badge className="font-mono">Python</Badge>
```

---

## Status Dot

```tsx
// Inline status indicator — use instead of colored glow orbs
<div className="flex items-center gap-2">
  <div className={cn("w-2 h-2 rounded-full shrink-0", {
    "bg-green-500":  status === "active",
    "bg-yellow-500": status === "pending",
    "bg-red-500":    status === "inactive" || status === "error",
    "bg-muted":      status === "unknown",
  })} />
  <span className="text-sm text-foreground capitalize">{status}</span>
</div>
```

---

## Progress Bar

```tsx
// No glow, no indigo fill — uses foreground token
<div className="space-y-1.5">
  <div className="flex items-center justify-between text-xs">
    <span className="text-muted-foreground">Label</span>
    <span className="font-medium text-foreground">{value}%</span>
  </div>
  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
    <div
      className="h-full bg-foreground/70 rounded-full transition-all duration-500"
      style={{ width: `${value}%` }}
    />
  </div>
</div>
```

---

## Empty State

```tsx
<div className="py-16 text-center">
  <p className="text-sm font-medium text-foreground">No items found</p>
  <p className="text-xs text-muted-foreground mt-1">Optional description explaining why.</p>
  {/* Optional action */}
  <div className="mt-4">
    <Button variant="outline" size="sm">Action</Button>
  </div>
</div>
```

---

## Loading Skeleton

```tsx
// Always mirror the real page structure
function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-px" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-px" />
      <Skeleton className="h-64" />
    </div>
  );
}
```

---

## Icon Usage

```tsx
// All lucide icons must use strokeWidth={1.5}
// Size classes:
// In nav: w-4 h-4
// In buttons: w-4 h-4
// In page content / cards: w-4 h-4
// Standalone decorative: w-5 h-5 text-muted-foreground

import { Plus, Pencil, Trash2, Eye, Upload, Download, ChevronRight } from "lucide-react";

<Plus className="w-4 h-4" strokeWidth={1.5} />
```

---

## Never Use (Banned Patterns)

```tsx
// ❌ Glow shadow
className="shadow-[0_0_20px_rgba(79,70,229,0.3)]"

// ❌ Ambient glow div
<div className="absolute bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen" />

// ❌ Backdrop blur
className="backdrop-blur-xl"

// ❌ Forced dark colors
className="bg-slate-950"
className="border-white/5"
className="text-white"   // use text-foreground

// ❌ Oversized radius
className="rounded-2xl"
className="rounded-[2.5rem]"

// ❌ Heavy font weight
className="font-black"
className="text-4xl font-black tracking-tight"

// ❌ Uppercase loud labels
className="text-[10px] font-black uppercase tracking-[0.2em]"

// ❌ Gradient text
className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"

// ❌ Indigo hardcoded
className="bg-indigo-600 hover:bg-indigo-500"  // use bg-primary
className="text-indigo-400"                    // use text-foreground

// ❌ Icon without strokeWidth
<SearchIcon className="w-5 h-5" />   // Missing strokeWidth={1.5}
```
