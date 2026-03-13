export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/helpers";
import FacultyRankingsPage from "@/app/(faculty)/faculty/drives/[driveId]/rankings/page";

interface PageProps {
  params: { driveId: string };
}

export default async function AdminDriveRankingsPage({ params }: PageProps) {
  await requireRole(["admin"]);

  // Reuse the faculty rankings page UI inside the admin layout route
  return <FacultyRankingsPage params={params} />;
}

