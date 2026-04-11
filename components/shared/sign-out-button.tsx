"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  function handleSignOut() {
    if (confirm("Are you sure you want to sign out?")) {
      signOut({ callbackUrl: "/login" });
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-bold bg-muted hover:bg-accent border border-border text-foreground px-5 py-2 rounded-md transition-all shadow-none"
    >
      Sign out
    </button>
  );
}
