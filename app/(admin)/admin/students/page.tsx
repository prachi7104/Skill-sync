"use client";

import StudentSearchView from "@/components/shared/student-search-view";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function AdminStudentsPage() {
  return (
    <StudentSearchView 
      apiEndpoint="/api/admin/students/search" 
      title="Students"
      description="Manage and search student profiles across all batches and branches."
      headerActions={
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
          Import CSV
        </Button>
      }
    />
  );
}
