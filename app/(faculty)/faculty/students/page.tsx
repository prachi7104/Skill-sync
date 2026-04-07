"use client";

import StudentSearchView from "@/components/shared/student-search-view";

export default function FacultyStudentsPage() {
  return (
    <StudentSearchView 
        apiEndpoint={"/api/faculty/students/search"} 
        title="Students"
        description="Search and view student profiles across all batches and branches."
    />
  );
}
