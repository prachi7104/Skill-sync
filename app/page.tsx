import { getCachedSession } from "@/lib/auth/session-cache";
import { getStudentProfile } from "@/lib/auth/helpers";
import { computeOnboardingProgress } from "@/lib/utils/onboarding";
import { redirect } from "next/navigation";
import RootLoginPage from "@/components/auth/root-login-page";

export default async function Home() {
  const session = await getCachedSession();

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

  return <RootLoginPage guestDemoUrl={guestDemoUrl()} />;
}

/** The public guest demo (a separate deployment). The entry is hidden unless this is a valid https URL. */
function guestDemoUrl(): string | null {
  const raw = process.env.GUEST_DEMO_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
