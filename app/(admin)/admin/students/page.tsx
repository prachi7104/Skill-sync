"use client";

import StudentSearchView from "@/components/shared/student-search-view";

export default function AdminStudentsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-32 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-950/60 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Student Lookup</h1>
          <p className="text-sm leading-6 text-muted-foreground">Search student profiles, review readiness, and inspect profile completeness from the admin scope.</p>
        </div>
      </header>
      <StudentSearchView apiEndpoint={"/api/admin/students/search"} />
    </div>
  );
}
