import ResourceLibrary from "@/components/shared/resource-library";

export default function AdminResourcesPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-32 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Resource Library</h1>
          <p className="text-sm leading-6 text-muted-foreground">Manage academic content, placement resources, and student-facing material.</p>
        </div>
      </header>
      <ResourceLibrary />
    </div>
  );
}