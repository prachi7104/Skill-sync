import { notFound, redirect } from "next/navigation";
import { GuestShell } from "@/components/guest/guest-shell";
import { RecruiterPortal } from "@/components/guest/recruiter-portal";
import { StudentPortal } from "@/components/guest/student-portal";
import { guestAccessEnabled } from "@/lib/demo/config";
import { requireDemoGuest } from "@/lib/demo/session";

export const dynamic = "force-dynamic";

export default async function GuestPortalPage({ params, searchParams }: { params: { portal: string }; searchParams: { intro?: string } }) {
  if (!guestAccessEnabled() || (params.portal !== "student" && params.portal !== "recruiter")) notFound();
  const guest = await requireDemoGuest();
  if (!guest) redirect("/guest?ended=1");
  if (params.portal !== guest.kind) redirect(`/guest/${guest.kind}`);

  return (
    <GuestShell kind={guest.kind} expiresAt={guest.expiresAt} showIntro={searchParams.intro === "1"}>
      {guest.kind === "student" ? <StudentPortal /> : <RecruiterPortal />}
    </GuestShell>
  );
}
