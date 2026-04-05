import { ReactNode } from "react";
import { requireAuth, requireComponent } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";

export default async function NewDriveLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth();

  if (user.role === "admin") {
    redirect("/admin/drives/new");
  }

  try {
    await requireComponent("drive_management");
  } catch {
    redirect("/faculty?error=no_permission");
  }

  return <>{children}</>;
}
