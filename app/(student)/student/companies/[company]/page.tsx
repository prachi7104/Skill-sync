import CompanyExperienceWall from "@/components/student/company-experience-wall";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function StudentCompanyDetailPage({ params }: { params: { company: string } }) {
  return (
    <>
      <div className="mx-auto max-w-6xl">
        <Link
          href="/student/companies"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ChevronLeft size={15} aria-hidden="true" />
          Back to Companies
        </Link>
      </div>
      <CompanyExperienceWall companySlug={params.company} />
    </>
  );
}