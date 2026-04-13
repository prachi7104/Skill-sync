import ResourceLibrary from "@/components/shared/resource-library";

export default function FacultyResourcesPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">

      <header className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="max-w-2xl space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Resource Library
          </p>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Academic Resources
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Browse and manage technical resources, soft skills content,
            and student-facing placement materials.
          </p>
        </div>
      </header>

      <ResourceLibrary />

    </div>
  );
}