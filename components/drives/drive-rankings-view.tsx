import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Users,
  TrendingUp,
  Star,
  Award,
  MapPin,
  Briefcase,
  Calendar,
  IndianRupee,
  ChevronLeft,
} from "lucide-react";
import { format } from "date-fns";
import RankingsTable from "@/components/faculty/rankings-table";
import { getCompanyColor } from "@/lib/utils/company-color";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RankingRow {
  rankPosition: number;
  matchScore: number;
  isEligible: boolean;
  ineligibilityReason: string | null;
  profileCompletenessAtRank: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  shortExplanation: string;
  detailedExplanation: string;
  shortlisted: boolean | null;
  studentId: string;
  studentName: string;
  sapId: string | null;
  rollNo: string | null;
  branch: string | null;
  cgpa: number | null;
}

export interface DriveDetails {
  id: string;
  company: string;
  roleTitle: string;
  location: string | null;
  packageOffered: string | null;
  deadline: Date | string | null;
  isActive: boolean;
}

export interface DriveRankingsViewProps {
  driveId: string;
  rankings: RankingRow[];
  drive: DriveDetails;
  backHref: string;
  isTruncated: boolean;
  maxRankingsRows: number;
  distribution: Array<{ label: string; count: number }>;
  userRole: "faculty" | "admin";
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DriveRankingsView({
  driveId,
  rankings,
  drive,
  backHref,
  isTruncated,
  maxRankingsRows,
  distribution,
  userRole,
}: DriveRankingsViewProps) {
  const eligibleRankings = rankings.filter(
    (r) => r.isEligible && r.matchScore > 0,
  );
  const incompleteRankings = rankings.filter(
    (r) => r.isEligible && r.matchScore === 0 && !r.ineligibilityReason,
  );
  const ineligibleRankings = rankings.filter((r) => !r.isEligible);

  const avgScore = rankings.length
    ? (rankings.reduce((s, r) => s + r.matchScore, 0) / rankings.length).toFixed(1)
    : "—";
  const topScore = rankings.length
    ? Math.max(...rankings.map((r) => r.matchScore)).toFixed(1)
    : "—";
  const shortlistedCount = rankings.filter((r) => r.shortlisted === true).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 animate-in fade-in duration-500 sm:px-6 lg:px-8">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150"
      >
        <ChevronLeft size={15} aria-hidden="true" />
        Back to Drives
      </Link>

      {/* ── Drive Header Card ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <div className="border-b border-border bg-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div
              className={cn(
                "h-16 w-16 rounded-md flex items-center justify-center text-2xl font-black text-foreground uppercase shadow-lg ring-4 ring-background",
                getCompanyColor(drive.company),
              )}
            >
              {drive.company.slice(0, 2)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">
                  {drive.company}
                </h1>
                <Badge
                  variant={drive.isActive ? "default" : "outline"}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-black tracking-widest uppercase",
                    drive.isActive
                      ? "bg-success/10 hover:bg-success/10"
                      : "text-muted-foreground border-border",
                  )}
                >
                  {drive.isActive ? "Active Drive" : "Closed"}
                </Badge>
              </div>
              <p className="text-muted-foreground font-bold flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> {drive.roleTitle}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                {drive.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {drive.location}
                  </span>
                )}
                {drive.packageOffered && (
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" /> {drive.packageOffered}
                  </span>
                )}
                {drive.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Ends:{" "}
                    {format(new Date(drive.deadline), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 text-xs font-bold gap-2 border-border hover:bg-muted hover:text-primary transition-all shadow-sm"
            >
              <Link href={`/api/drives/${driveId}/export`} download>
                <Download className="h-3.5 w-3.5" /> Export All CSV
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 text-xs font-bold gap-2 border-primary/30 text-primary hover:bg-primary/10 transition-all shadow-sm"
            >
              <Link
                href={`/api/drives/${driveId}/export?shortlistedOnly=true`}
                download
              >
                <Star className="h-3.5 w-3.5 fill-current" /> Export Shortlisted
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Mini Stat Chips ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-card lg:grid-cols-4">
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Users className="h-3 w-3" /> Total Candidates
            </p>
            <p className="text-3xl font-mono font-black text-foreground leading-none">
              {rankings.length}
            </p>
          </div>
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <TrendingUp className="h-3 w-3" /> Average Score
            </p>
            <p className="text-3xl font-mono font-black text-foreground leading-none">
              {avgScore}%
            </p>
          </div>
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Award className="h-3 w-3" /> Top Match
            </p>
            <p className="text-3xl font-mono font-black text-foreground leading-none">
              {topScore}%
            </p>
          </div>
          <div className="p-6 text-center">
            <p className="text-[10px] font-black text-warning uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Star className="h-3 w-3 fill-current" /> Shortlisted
            </p>
            <p className="text-3xl font-mono font-black text-foreground leading-none">
              {shortlistedCount}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Rankings Table (Client Component) ────────────────────────────── */}
      <RankingsTable
        rankings={rankings}
        distribution={distribution}
        driveId={driveId}
        viewerRole={userRole}
      />

      {isTruncated && (
        <Card className="border-warning/20 bg-warning/10">
          <CardContent className="py-3 text-sm text-warning-foreground">
            Showing the first {maxRankingsRows} candidates for performance. Use
            CSV export for full data.
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="pt-6 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-success">
                Eligible + Scored
              </h3>
              <Badge className="bg-success/10 text-success border border-success/20">
                {eligibleRankings.length}
              </Badge>
            </div>
            {eligibleRankings.slice(0, 10).map((r) => (
              <div
                key={r.studentId}
                className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm flex items-center justify-between"
              >
                <span className="text-foreground">
                  #{r.rankPosition} {r.studentName}
                </span>
                <span className="text-success font-semibold">
                  {r.matchScore.toFixed(1)}%
                </span>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-warning">
                Eligible + Incomplete Profile
              </h3>
              <Badge className="bg-warning/10 text-warning border border-warning/20">
                {incompleteRankings.length}
              </Badge>
            </div>
            {incompleteRankings.slice(0, 10).map((r) => (
              <div
                key={r.studentId}
                className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-sm flex items-center justify-between"
              >
                <span className="text-foreground">
                  #{r.rankPosition} {r.studentName}
                </span>
                <Badge
                  variant="outline"
                  className="border-warning/20 text-warning"
                >
                  Complete Profile
                </Badge>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                Ineligible
              </h3>
              <Badge className="border border-border bg-background text-foreground">
                {ineligibleRankings.length}
              </Badge>
            </div>
            {ineligibleRankings.slice(0, 10).map((r) => (
              <div
                key={r.studentId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  Ineligible • {r.studentName}
                </span>
                <Badge
                  variant="outline"
                  className="border-border text-muted-foreground max-w-[60%] truncate"
                >
                  {r.ineligibilityReason ?? "Does not meet criteria"}
                </Badge>
              </div>
            ))}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
