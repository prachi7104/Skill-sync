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

  return <RootLoginPage />;
}
