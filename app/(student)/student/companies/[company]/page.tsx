import CompanyExperienceWall from "@/components/student/company-experience-wall";

export default function StudentCompanyDetailPage({ params }: { params: { company: string } }) {
  return <CompanyExperienceWall companySlug={params.company} />;
}