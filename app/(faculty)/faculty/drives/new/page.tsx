"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { NewDriveForm } from "@/components/drives/new-drive-form";

export default function NewDrivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/faculty/drives";

  return (
    <NewDriveForm
      onSuccess={() => {
        router.push(returnTo);
        router.refresh();
      }}
    />
  );
}
