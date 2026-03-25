"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { NewDriveForm } from "@/components/drives/new-drive-form";

export default function AdminNewDrivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/admin/drives";

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create New Drive</h1>
        <p className="mt-1 text-slate-400">Create a placement drive for your college</p>
      </div>
      <NewDriveForm
        onSuccess={() => {
          router.push(returnTo);
          router.refresh();
        }}
      />
    </div>
  );
}
