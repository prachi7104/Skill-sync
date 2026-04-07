import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Notion tag: small, soft, monospace-ish, no border by default
  "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        // Default: gray — like Notion's default tag
        default:     "bg-secondary text-secondary-foreground",
        // Secondary: alias for default (backwards compat)
        secondary:   "bg-secondary text-secondary-foreground",
        // Blue — for status/info
        blue:        "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
        // Green — for success/positive
        green:       "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
        // Red — for errors/destructive
        red:         "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
        // Yellow — for warnings
        yellow:      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
        // Purple — for special labels
        purple:      "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
        // Outline — when you need a bordered empty tag
        outline:     "border border-border text-foreground",
        // Destructive — maps to --destructive
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
