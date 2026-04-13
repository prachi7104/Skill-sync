import * as React from "react"
import { Loader2, AlertCircle, Circle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type StatusVariant = "error" | "empty" | "loading" | "info"

interface StatusCardProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  variant?: StatusVariant
}

const ICON_MAP: Record<StatusVariant, React.ElementType> = {
  error: AlertCircle,
  empty: Circle,
  loading: Loader2,
  info: Info,
}

export function StatusCard({ title, description, actionLabel, onAction, variant = "info" }: StatusCardProps) {
  const Icon = ICON_MAP[variant]
  const isLoading = variant === "loading"

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card px-5 py-6 text-sm text-foreground",
        variant === "error" && "border-destructive/40 bg-destructive/5 text-destructive",
        variant === "empty" && "border-border bg-card text-muted-foreground",
        variant === "info" && "border-border bg-card text-muted-foreground",
        variant === "loading" && "border-border bg-card text-muted-foreground"
      )}
      role="status"
      aria-live={variant === "error" || variant === "empty" ? "polite" : "off"}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("h-5 w-5 shrink-0", variant === "error" ? "text-destructive" : "text-muted-foreground")} aria-hidden="true" />
        <p className="text-base font-bold text-foreground">{title}</p>
      </div>
      {description ? <p className="text-[13px] text-muted-foreground">{description}</p> : null}
      {onAction && actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex items-center justify-center rounded-md border border-border bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
        >
          {isLoading ? "Loading…" : actionLabel}
        </button>
      ) : null}
    </div>
  )
}
