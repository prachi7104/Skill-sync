import { getCachedSession } from "@/lib/auth/session-cache";
import { getStudentProfile } from "@/lib/auth/helpers";
import { computeOnboardingProgress } from "@/lib/utils/onboarding";
import { redirect } from "next/navigation";
import RootLoginPage from "@/components/auth/root-login-page";
import { guestAccessEnabled } from "@/lib/demo/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getCachedSession();

  if (session?.user?.isGuest) {
    redirect(session.user.role === "faculty" ? "/guest/recruiter" : "/guest/student");
  }

  if (session?.user?.role) {
    switch (session.user.role) {
      case "student":
        if (!session.user.id) {
          redirect("/student/onboarding");
        }
        const profile = await getStudentProfile(session.user.id);
        if (!profile) {
          redirect("/student/onboarding");
        }
        const { onboardingRequired } = computeOnboardingProgress(profile);
        if (onboardingRequired) {
          redirect("/student/onboarding");
        }
        redirect("/student/dashboard");
      case "faculty":
        redirect("/faculty");
      case "admin":
        redirect("/admin");
    }
  }

  // A guest-only demo deployment has no institutional sign-in of its own: send
  // visitors (including "Back" and "Exit demo") to the institutional site.
  const institutionalSite = institutionalSiteUrl();
  if (institutionalSite && guestAccessEnabled()) redirect(institutionalSite);

  return <RootLoginPage guestDemoEnabled={guestAccessEnabled()} />;
}

function institutionalSiteUrl(): string | null {
  const raw = process.env.INSTITUTIONAL_SITE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
