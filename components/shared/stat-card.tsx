import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "success" | "warning" | "destructive";

const TONE_CLASSES: Record<Tone, string> = {
  primary:     "text-primary bg-primary/10",
  success:     "text-success bg-success/10",
  warning:     "text-warning bg-warning/10",
  destructive: "text-destructive bg-destructive/10",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  className,
}: StatCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5 shadow-sm", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <div className={cn("rounded-full p-1.5", TONE_CLASSES[tone])}>
            <Icon size={14} aria-hidden="true" />
          </div>
        )}
      </div>
      <p className="text-3xl font-black tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
