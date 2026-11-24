import { notFound } from "next/navigation";
import { DemoGuestSelection } from "@/components/auth/demo-entry";
import { guestAccessEnabled } from "@/lib/demo/config";
import { requireDemoGuest } from "@/lib/demo/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Try the SkillSync live demo" };

export default async function GuestPage({ searchParams }: { searchParams: { ended?: string } }) {
  if (!guestAccessEnabled()) notFound();
  const guest = await requireDemoGuest();
  return <DemoGuestSelection workspaceError={searchParams.ended === "1"} current={guest?.kind ?? null} />;
}
