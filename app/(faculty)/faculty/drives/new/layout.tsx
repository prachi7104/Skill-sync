import { ReactNode } from "react";
import { requireComponent } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";

export default async function NewDriveLayout({ children }: { children: ReactNode }) {
  try {
    await requireComponent("drive_management");
  } catch {
    redirect("/faculty?error=no_permission");
  }

  return <>{children}</>;
}
