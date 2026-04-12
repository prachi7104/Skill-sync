"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Filter, Loader, AlertCircle, ExternalLink, X } from "lucide-react";

const debounce = <T extends any[]>(func: (...args: T) => void, delay: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  sapId: string | null;
  rollNo: string | null;
  branch: string | null;
  batchYear: number | null;
  cgpa: number | null;
  tenthPercentage: number | null;
  twelfthPercentage: number | null;
  semester: number | null;
  category: string | null;
  profileCompleteness: number;
  resumeUrl: string | null;
  resumeFilename: string | null;
  resumeUploadedAt: string | null;
  skills: Array<{ name: string; proficiency?: string }>;
  projects: Array<{ title: string; description: string; techStack?: string[] }>;
  workExperience: Array<{ company: string; role: string; startDate: string; endDate: string; description: string }>;
  certifications: Array<{ title: string; issuer: string; date: string }>;
  codingProfiles: Array<{ platform: string; username: string }>;
  researchPapers: Array<{ title: string; url: string; date: string }>;
  achievements: Array<{ title: string; description: string; date: string }>;
  softSkills: string[];
  hasEmbedding: boolean;
}

interface SearchResponse {
  students: StudentProfile[];
  total: number;
  page: number;
}

interface StudentSearchViewProps {
  apiEndpoint: string;
}

export function ProfileModal({ student, onClose }: { student: StudentProfile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{student.name}</h2>
            <p className="text-sm text-warning mt-1">
              📌 Read-only view. Students manage their own profiles.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-muted/40"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-8">
          <section>
            <h3 className="text-lg font-bold text-foreground mb-4">Identity</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="text-foreground font-medium">{student.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">SAP ID</p>
                <p className="text-foreground font-medium">{student.sapId || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Roll No</p>
                <p className="text-foreground font-medium">{student.rollNo || "—"}</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-foreground mb-4">Academics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">CGPA</p>
                <p className="text-foreground font-medium">{student.cgpa?.toFixed(2) || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">10th %</p>
                <p className="text-foreground font-medium">{student.tenthPercentage?.toFixed(2) || "—"}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">12th %</p>
                <p className="text-foreground font-medium">{student.twelfthPercentage?.toFixed(2) || "—"}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Branch</p>
                <p className="text-foreground font-medium">{student.branch || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Batch Year</p>
                <p className="text-foreground font-medium">{student.batchYear || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Semester</p>
                <p className="text-foreground font-medium">{student.semester || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="text-foreground font-medium capitalize">{student.category || "—"}</p>
              </div>
            </div>
          </section>

          {student.resumeUrl && (
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">Resume</h3>
              <div className="bg-muted/20 border border-border rounded-md p-4">
                <p className="text-sm text-muted-foreground mb-2">File: {student.resumeFilename}</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Uploaded: {student.resumeUploadedAt ? new Date(student.resumeUploadedAt).toLocaleDateString() : "—"}
                </p>
                <a
                  href={student.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary text-foreground rounded-lg text-sm font-semibold transition"
                >
                  View Resume <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </section>
          )}

          {student.skills.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-lg text-sm">
                    {skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {student.projects.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">Projects ({student.projects.length})</h3>
              <div className="space-y-3">
                {student.projects.map((p, i) => (
                  <div key={i} className="bg-muted/20 border border-border rounded-md p-4">
                    <p className="font-semibold text-foreground">{p.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                    {p.techStack && p.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.techStack.map((tech, j) => (
                          <span key={j} className="text-xs px-2 py-1 bg-card text-muted-foreground rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {student.workExperience.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">Work Experience ({student.workExperience.length})</h3>
              <div className="space-y-3">
                {student.workExperience.map((exp, i) => (
                  <div key={i} className="bg-muted/20 border border-border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-foreground">{exp.role}</p>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{exp.startDate} to {exp.endDate}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {student.certifications.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">Certifications ({student.certifications.length})</h3>
              <div className="space-y-2">
                {student.certifications.map((cert, i) => (
                  <div key={i} className="flex justify-between items-start bg-muted/20 border border-border rounded-md p-3">
                    <div>
                      <p className="font-semibold text-foreground">{cert.title}</p>
                      <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{cert.date}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {student.codingProfiles.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">Coding Profiles ({student.codingProfiles.length})</h3>
              <div className="space-y-2">
                {student.codingProfiles.map((profile, i) => (
                  <div key={i} className="bg-muted/20 border border-border rounded-md p-3">
                    <p className="text-sm text-muted-foreground">{profile.platform}</p>
                    <p className="text-foreground font-medium">{profile.username}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {student.researchPapers.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">Research Papers ({student.researchPapers.length})</h3>
              <div className="space-y-2">
                {student.researchPapers.map((paper, i) => (
                  <div key={i} className="bg-muted/20 border border-border rounded-md p-3">
                    <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary font-medium">
                      {paper.title}
                    </a>
                    <p className="text-sm text-muted-foreground">{paper.date}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {student.achievements.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">Achievements ({student.achievements.length})</h3>
              <div className="space-y-3">
                {student.achievements.map((ach, i) => (
                  <div key={i} className="bg-muted/20 border border-border rounded-md p-4">
                    <p className="font-semibold text-foreground">{ach.title}</p>
                    <p className="text-sm text-muted-foreground">{ach.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{ach.date}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {student.softSkills.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-foreground mb-4">Soft Skills</h3>
              <div className="flex flex-wrap gap-2">
                {student.softSkills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-lg text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentSearchView({ apiEndpoint }: StudentSearchViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedBatchYear, setSelectedBatchYear] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<StudentProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [batchYears, setBatchYears] = useState<number[]>([]);

  const performSearch = useCallback(
    async (q: string, branch: string, year: string, page: number) => {
      if (!q && branch === "all" && year === "all") {
        setResults([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (q) params.append("q", q);
        if (branch !== "all") params.append("branch", branch);
        if (year !== "all") params.append("batchYear", year);
        params.append("page", page.toString());

        const res = await fetch(`${apiEndpoint}?${params}`);

        if (!res.ok) {
          throw new Error("Failed to fetch students");
        }

        const data: SearchResponse = await res.json();
        setResults(data.students);
        setTotal(data.total);
        setCurrentPage(page);

        const uniqueBranches = Array.from(
          new Set(data.students.map((s) => s.branch).filter(Boolean))
        ) as string[];
        const uniqueYears = Array.from(
          new Set(data.students.map((s) => s.batchYear).filter(Boolean))
        ) as number[];

        setBranches(uniqueBranches.sort());
        setBatchYears(uniqueYears.sort((a, b) => b - a));
      } catch (err) {
        console.error("[Search Error]", err);
        setError("Failed to search students. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [apiEndpoint]
  );

  const debouncedSearch = useCallback(
    debounce((q: string, branch: string, year: string, page: number) => {
      performSearch(q, branch, year, page);
    }, 300),
    [performSearch]
  );

  useEffect(() => {
    if (searchQuery || selectedBranch !== "all" || selectedBatchYear !== "all") {
      debouncedSearch(searchQuery, selectedBranch, selectedBatchYear, 1);
    } else {
      setResults([]);
      setTotal(0);
      setError(null);
    }
  }, [searchQuery, selectedBranch, selectedBatchYear, debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    performSearch(searchQuery, selectedBranch, selectedBatchYear, newPage);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            Student profiles
          </div>
          <h1 className="text-4xl font-black text-foreground">Search and view student profiles</h1>
          <p className="text-sm text-muted-foreground">Filter by branch, batch, and search terms to review college profiles quickly.</p>
        </div>

        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or SAP ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Branches</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

            <select
              value={selectedBatchYear}
              onChange={(e) => {
                setSelectedBatchYear(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Batch Years</option>
              {batchYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-6 w-6 text-primary animate-spin" />
            <span className="ml-3 text-muted-foreground">Searching students...</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-destructive">{error}</div>
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="py-12 text-center">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchQuery || selectedBranch !== "all" || selectedBatchYear !== "all"
                ? "No students found matching your criteria."
                : "Search to find student profiles"}
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="mb-6 text-sm text-muted-foreground">
              Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, total)} of {total} results
            </div>

            <div className="space-y-3 mb-8">
              {results.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <div className="text-sm">
                        <span className="rounded-lg bg-background px-2.5 py-1 text-muted-foreground">
                          {student.branch || "—"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">{student.batchYear || "—"}</div>
                      <div className="text-sm font-semibold text-primary">
                        CGPA: {student.cgpa?.toFixed(2) || "—"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {student.profileCompleteness}% Complete
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="ml-4 shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>

            {total > 20 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg bg-background px-4 py-2 text-foreground transition hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-muted-foreground">
                  Page {currentPage} of {Math.ceil(total / 20)}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(total / 20)}
                  className="rounded-lg bg-background px-4 py-2 text-foreground transition hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {selectedStudent && (
          <ProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
      </div>
    </div>
  );
}
