import ResourceLibrary from "@/components/shared/resource-library";
import PageHeader from "@/components/shared/page-header";

export default function AdminResourcesPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-32 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="Resource Library"
        description="Manage academic content, placement resources, and student-facing material."
      />
      <ResourceLibrary />
    </div>
  );
}