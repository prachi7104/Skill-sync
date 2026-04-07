"use client";

import { Toaster } from "sonner";
import { useEffect, useState } from "react";

/**
 * Renders the Sonner <Toaster> only after hydration.
 *
 * Sonner injects portal DOM nodes that don't exist in server HTML.
 * Using a mounted guard ensures the first client render matches
 * the server render (both render nothing), then the Toaster
 * appears on the second paint — no hydration mismatch.
 */
export default function ClientToaster() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                classNames: {
                    toast: "bg-popover border border-border text-foreground text-sm rounded-md shadow-lg",
                    description: "text-muted-foreground text-xs",
                    actionButton: "bg-primary text-primary-foreground text-xs rounded-md px-2 py-1",
                    cancelButton: "bg-secondary text-secondary-foreground text-xs rounded-md px-2 py-1",
                },
            }}
        />
    );
}
