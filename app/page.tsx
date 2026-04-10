import { getCachedSession } from "@/lib/auth/session-cache";
import { redirect } from "next/navigation";
import LandingHeader from "@/components/landing/landing-header";
import LandingHero from "@/components/landing/landing-hero";
import LandingFeatureGrid from "@/components/landing/landing-feature-grid";
import LandingFooterStrip from "@/components/landing/landing-footer-strip";

export default async function Home() {
  const session = await getCachedSession();

  // Role routing remains untouched
  if (session?.user?.role) {
    switch (session.user.role) {
      case "student":
        redirect("/student/dashboard");
      case "faculty":
        redirect("/faculty");
      case "admin":
        redirect("/admin/health");
    }
  }

  // Visual rendering is delegated to landing sub-components. Auth logic above is unchanged.
  return (
    <div className='min-h-screen bg-background flex flex-col font-sans'>
      <LandingHeader />  {/* sticky header — client component */}
      <main className='flex-1 flex flex-col'>
        <LandingHero />         {/* hero — client component for motion */}
        <LandingFeatureGrid />  {/* bento grid — client component */}
        <LandingFooterStrip />  {/* footer row — server component */}
      </main>
    </div>
  );
}