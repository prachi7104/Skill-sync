import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: React.ReactNode | string; // small caps label above title
  title: string;          // main h1
  description?: React.ReactNode | string;   // subtitle paragraph
  actions?: React.ReactNode; // right-side action buttons
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
      "rounded-lg border border-border bg-card px-6 py-5 shadow-sm",
      className
    )}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-1">
          {eyebrow && (
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1.5">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
