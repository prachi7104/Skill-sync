"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Mail, Shield } from "lucide-react";

export default function StudentSettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">

      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account information.</p>
      </div>

      {/* Account info card */}
      <section className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Account</h2>

        <div className="flex items-center gap-3">
          <Mail size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="text-sm font-medium text-foreground">
              {session?.user?.email || "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Shield size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Role</p>
            <Badge variant="neutral" className="mt-0.5 capitalize">
              {session?.user?.role || "student"}
            </Badge>
          </div>
        </div>
      </section>

      {/* Name / profile edits — redirect to onboarding/profile */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">Profile Details</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your name, SAP ID, branch, and academic details are managed through your{" "}
          <a
            href="/student/profile"
            className="font-semibold text-primary hover:text-primary-hover transition-colors duration-150"
          >
            Profile page
          </a>
          .
        </p>
      </section>

    </div>
  );
}
