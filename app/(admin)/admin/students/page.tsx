"use client";

import StudentSearchView from "@/components/shared/student-search-view";

export default function AdminStudentsPage() {
  return <StudentSearchView apiEndpoint={"/api/admin/students/search"} />;
}
