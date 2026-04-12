"use client";

import StudentSearchView from "@/components/shared/student-search-view";
import PageHeader from "@/components/shared/page-header";

export default function AdminStudentsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-32 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="Student Lookup"
        description="Search student profiles, review readiness, and inspect profile completeness."
      />
      <StudentSearchView apiEndpoint={"/api/admin/students/search"} />
    </div>
  );
}
