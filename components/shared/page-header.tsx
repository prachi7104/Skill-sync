import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: React.ReactNode | string;
  title: string;
  description?: React.ReactNode | string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn(
      "rounded-lg border border-border px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5",
      className
    )}>
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-0.5 sm:space-y-1">
          {eyebrow && (
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1.5">
              {eyebrow}
            </div>
          )}
          <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap gap-1.5 sm:gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
