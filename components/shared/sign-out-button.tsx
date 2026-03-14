"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-5 py-2 rounded-xl transition-all shadow-sm"
    >
      Sign out
    </button>
  );
}
