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

    return <Toaster richColors position="bottom-right" />;
}
