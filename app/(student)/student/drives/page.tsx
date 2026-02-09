import { db } from "@/lib/db";
import { drives, rankings } from "@/lib/db/schema";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { eq } from "drizzle-orm";
import { format } from "date-fns";

export default async function StudentDrivesPage() {
  const { user, profile } = await requireStudentProfile();

  // Fetch all active drives
  const activeDrives = await db.query.drives.findMany({
    where: eq(drives.isActive, true),
    orderBy: (drives, { desc }) => [desc(drives.createdAt)],
  });

  // Filter by eligibility
  const eligible = activeDrives.filter((drive) => {
    if (drive.minCgpa !== null && drive.minCgpa !== undefined) {
      if (profile.cgpa === null || profile.cgpa === undefined) return false;
      if (profile.cgpa < drive.minCgpa) return false;
    }

    const branches = drive.eligibleBranches as string[] | null;
    if (branches && branches.length > 0) {
      if (!profile.branch) return false;
      const normalized = branches.map((b) => b.toLowerCase().trim());
      if (!normalized.includes(profile.branch.toLowerCase().trim())) return false;
    }

    const batchYears = drive.eligibleBatchYears as number[] | null;
    if (batchYears && batchYears.length > 0) {
      if (profile.batchYear === null || profile.batchYear === undefined) return false;
      if (!batchYears.includes(profile.batchYear)) return false;
    }

    const categories = drive.eligibleCategories as string[] | null;
    if (categories && categories.length > 0) {
      if (!profile.category) return false;
      if (!categories.includes(profile.category)) return false;
    }

    return true;
  });

  // Fetch rankings for this student
  const studentRankings = await db.query.rankings.findMany({
    where: eq(rankings.studentId, user.id),
  });
  const rankingMap = new Map(studentRankings.map((r) => [r.driveId, r]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Available Drives</h1>
        <p className="text-sm text-gray-500 mt-1">
          Active placement drives matching your eligibility.
        </p>
      </div>

      {eligible.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">No eligible drives</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no active drives matching your profile right now. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {eligible.map((drive) => {
            const ranking = rankingMap.get(drive.id);
            return (
              <div
                key={drive.id}
                className="rounded-lg border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{drive.company}</h3>
                    <p className="text-sm text-gray-600">{drive.roleTitle}</p>
                  </div>
                  {ranking && (
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        Score: {ranking.matchScore.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400 mt-0.5">
                        Rank #{ranking.rankPosition}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  {drive.location && <p>📍 {drive.location}</p>}
                  {drive.packageOffered && <p>💰 {drive.packageOffered}</p>}
                  {drive.minCgpa && <p>📊 Min. CGPA: {drive.minCgpa}</p>}
                  <p>
                    📅{" "}
                    {drive.deadline
                      ? `Deadline: ${format(new Date(drive.deadline), "MMM d, yyyy")}`
                      : "No deadline"}
                  </p>
                </div>

                {ranking && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-xs text-gray-600">{ranking.shortExplanation}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ranking.matchedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                      {ranking.missingSkills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700"
                        >
                          ✗ {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!ranking && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-xs text-gray-400 italic">
                      Rankings not yet generated for this drive.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
