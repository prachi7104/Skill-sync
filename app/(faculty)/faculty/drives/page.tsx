import { db } from "@/lib/db";
import { drives } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/helpers";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { format } from "date-fns";

export default async function FacultyDrivesPage() {
  const user = await requireRole(["faculty", "admin"]);

  const drivesList = await db.query.drives.findMany({
    where: eq(drives.createdBy, user.id),
    orderBy: (drives, { desc }) => [desc(drives.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Placement Drives</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your placement drives and view rankings.
          </p>
        </div>
        <Link
          href="/faculty/drives/new"
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
        >
          + Create Drive
        </Link>
      </div>

      {drivesList.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">No drives yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first placement drive to get started.
          </p>
          <Link
            href="/faculty/drives/new"
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
          >
            Create Drive
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Deadline
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {drivesList.map((drive) => (
                <tr key={drive.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {drive.company}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {drive.roleTitle}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {drive.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        Closed
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {drive.deadline
                      ? format(new Date(drive.deadline), "MMM d, yyyy")
                      : "No deadline"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/faculty/drives/${drive.id}/rankings`}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        View Rankings
                      </Link>
                      <form action={`/api/drives/${drive.id}/rank`} method="POST">
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          Trigger Ranking
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
