"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { NewDriveForm } from "@/components/drives/new-drive-form";

export default function AdminNewDrivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/admin/drives";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 pb-32 sm:px-6 lg:px-8">
      <header className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Create New Drive</h1>
          <p className="text-sm leading-6 text-muted-foreground">Create a placement drive for your college.</p>
        </div>
      </header>

      <NewDriveForm
        onSuccess={() => {
          router.push(returnTo);
          router.refresh();
        }}
      />
    </div>
  );
}
