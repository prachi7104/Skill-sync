import { getCachedSession } from "@/lib/auth/session-cache";
import { getStudentProfile } from "@/lib/auth/helpers";
import { computeOnboardingProgress } from "@/lib/utils/onboarding";
import { redirect } from "next/navigation";
import LandingHeader from "@/components/landing/landing-header";
import LandingHero from "@/components/landing/landing-hero";
import LandingProofStrip from "@/components/landing/landing-proof-strip";
import LandingFeatureGrid from "@/components/landing/landing-feature-grid";
import LandingHowItWorks from "@/components/landing/landing-how-it-works";
import LandingFaq from "@/components/landing/landing-faq";
import LandingFinalCta from "@/components/landing/landing-final-cta";
import LandingFooterStrip from "@/components/landing/landing-footer-strip";

export default async function Home() {
  const session = await getCachedSession();

  // Role routing remains untouched
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

  // Visual rendering is delegated to landing sub-components. Auth logic above is unchanged.
  return (
    <div className='relative flex min-h-screen flex-col overflow-x-clip bg-background font-sans text-foreground'>
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div aria-hidden='true' className='hidden lg:block absolute -top-28 left-1/2 h-[28rem] w-[64rem] -translate-x-1/2 bg-background/80 blur-3xl dark:bg-background/50' />
        <div aria-hidden='true' className='hidden lg:block absolute -left-24 top-[22rem] h-72 w-72 rounded-full bg-muted blur-3xl dark:bg-background/40' />
        <div aria-hidden='true' className='hidden lg:block absolute bottom-0 right-0 h-80 w-80 rounded-full bg-muted blur-3xl dark:bg-background/40' />
      </div>
      <LandingHeader />  {/* sticky header — client component */}
      <main className='flex flex-1 flex-col'>
        <LandingHero />         {/* hero — client component for motion */}
        <LandingProofStrip />   {/* stats + company logos */}
        <LandingFeatureGrid />  {/* core capabilities */}
        <LandingHowItWorks />   {/* 3-step workflow */}
        <LandingFaq />          {/* FAQ accordion */}
        <LandingFinalCta />
        <LandingFooterStrip />  {/* footer row — server component */}
      </main>
    </div>
  );
}
