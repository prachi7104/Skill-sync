import { redirect } from "next/navigation";

export default function AdminPage() {
  // The real admin landing page is System Health — redirect to it.
  // The sidebar provides navigation to All Drives and User Management.
  redirect("/admin/health");
}
