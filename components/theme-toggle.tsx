"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      aria-label={mounted ? `Switch to ${nextTheme} theme` : "Toggle theme"}
      className="text-muted-foreground hover:text-foreground"
    >
      {/* Render placeholder during SSR / before mount to prevent flash */}
      {!mounted ? (
        <span className="h-5 w-5" aria-hidden="true" />
      ) : resolvedTheme === "dark" ? (
        <Moon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Sun className="h-5 w-5" aria-hidden="true" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
