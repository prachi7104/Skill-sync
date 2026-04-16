"use client";
import { signOut } from "next-auth/react";
import { useConfirmDialog } from "@/components/shared/use-confirm-dialog";

export default function SignOutButton() {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  async function handleSignOut() {
    const confirmed = await confirm({
      title: "Sign out?",
      description: "You will be redirected to the login page.",
      confirmText: "Sign out",
    });

    if (!confirmed) return;
    signOut({ callbackUrl: "/" });
  }

  return (
    <>
      <button
        onClick={handleSignOut}
        className="text-sm font-bold bg-muted hover:bg-accent border border-border text-foreground px-5 py-2 rounded-md transition-all shadow-none"
      >
        Sign out
      </button>
      {ConfirmDialog}
    </>
  );
}
