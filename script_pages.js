const fs = require('fs');

let f = 'app/(admin)/admin/page.tsx';
let txt = fs.readFileSync(f, 'utf8');

txt = txt.replace('import { ArrowRight, Sparkles } from "lucide-react";', 'import { ArrowRight, Sparkles, Users, Briefcase, TrendingUp } from "lucide-react";\nimport PageHeader from "@/components/shared/page-header";\nimport StatCard from "@/components/shared/stat-card";');

let headerStart = txt.indexOf('<header ');
let headerEnd = txt.indexOf('</header>') + 9;
let repHeader = `      <PageHeader
        eyebrow={<><Sparkles className="h-3.5 w-3.5" /> Admin control plane</>}
        title="Master Dashboard"
        description={\`Complete placement platform overview. Last updated \${format(now, "MMM d, h:mm a")}\`}
        actions={
          <>
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 shadow-sm text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">College scope</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{totalStudents[0]?.c ?? 0} {Number(totalStudents[0]?.c ?? 0) === 1 ? "student" : "students"}</p>
            </div>
            <Link href="/admin/drives" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 h-full">
              View drives <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />`;
txt = txt.substring(0, headerStart) + repHeader + txt.substring(headerEnd);

txt = txt.replace(
  /{ label: "Total Students", value: totalStudents\[0\]\?\.c \?\? 0, sub: `\${noResumeStudents\[0\]\?\.c \?\? 0\} without resume`, color: "indigo" },/,
  '{label: "Total Students", value: totalStudents[0]?.c ?? 0, icon: Users, tone: "primary" },'
);
txt = txt.replace(
  /{ label: "Active Drives", value: activeDrives\[0\]\?\.c \?\? 0, sub: `\${totalDrives\[0\]\?\.c \?\? 0\} total`, color: "emerald" },/,
  '{ label: "Active Drives", value: activeDrives[0]?.c ?? 0, icon: Briefcase, tone: "success" },'
);
txt = txt.replace(
  /{ label: "Rankings Generated", value: totalRankings\[0\]\?\.c \?\? 0, sub: `Avg score: \${avgMatchScore\[0\]\?\.avg \?\? 0}%`, color: "blue" },/,
  '{ label: "Rankings Generated", value: totalRankings[0]?.c ?? 0, icon: TrendingUp, tone: "primary" },'
);
txt = txt.replace(
  /{ label: "Faculty Members", value: facultyCount\?\.c \?\? 0, sub: "Active staff", color: "amber" },/,
  '{ label: "Faculty Members", value: facultyCount?.c ?? 0, icon: Users, tone: "warning" },'
);

txt = txt.replace(
  /<div key={stat\.label} className="bg-card rounded-xl border border-border p-6">[\s\S]*?<\/div>/g,
  '<StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone as "primary"|"success"|"warning"|"destructive"} />'
);

fs.writeFileSync(f, txt);

let f2 = 'app/(faculty)/faculty/page.tsx';
let txt2 = fs.readFileSync(f2, 'utf8');

txt2 = txt2.replace('import { Briefcase, Users, Clock, TrendingUp, Activity, PlusCircle, ArrowRight } from "lucide-react";', 'import { Briefcase, Users, Clock, TrendingUp, Activity, PlusCircle, ArrowRight } from "lucide-react";\nimport PageHeader from "@/components/shared/page-header";\nimport StatCard from "@/components/shared/stat-card";');

let header2Start = txt2.indexOf('<header ');
let header2End = txt2.indexOf('</header>') + 9;
let repHeader2 = `            <PageHeader
                eyebrow="Faculty dashboard"
                title={\`Good morning, \${firstName}\`}
                description="Track live drives, queued ranking jobs, and college-wide placement activity from one neutral shell."
                actions={
                  <>
                    <div className="flex flex-wrap gap-2 mr-4">
                        <Link href="/faculty" className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors flex items-center", selectedSeasonId === "all" ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground hover:text-foreground")}>
                            All seasons
                        </Link>
                        {seasonRows.map((season) => (
                            <Link
                                key={season.id}
                                href={\`/faculty?seasonId=\${season.id}\`}
                                className={cn("whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors flex items-center", selectedSeasonId === season.id ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground hover:text-foreground")}
                            >
                                {season.name}
                            </Link>
                        ))}
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm shadow-sm text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Season scope</p>
                        <p className="mt-1 font-semibold text-foreground">{filteredDrives.length} drives visible</p>
                    </div>
                    <Link href="/faculty/drives/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 h-full">
                        <PlusCircle className="h-4 w-4" /> Create Drive
                    </Link>
                  </>
                }
            />`;

txt2 = txt2.substring(0, header2Start) + repHeader2 + txt2.substring(header2End);

// Remove the inline StatCard logic and props
let statCodeRegex = /const statTone = \{[\s\S]*?\};\s*interface StatCardProps \{[\s\S]*?\}\s*const StatCard = \([\s\S]*?\);/;
txt2 = txt2.replace(statCodeRegex, '');

// The cards in faculty/page.tsx:
// <StatCard label="Active Drives" value={activeDriveCount} icon={Briefcase} color="indigo" />
// We need to map `color` to `tone` and `indigo`->`primary`, `emerald`->`success`, `amber`->`warning`
txt2 = txt2.replace(/color="indigo"/g, 'tone="primary"');
txt2 = txt2.replace(/color="emerald"/g, 'tone="success"');
txt2 = txt2.replace(/color="amber"/g, 'tone="warning"');

fs.writeFileSync(f2, txt2);
console.log('done');
