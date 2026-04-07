"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Filter, Loader, AlertCircle, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
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
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
}

export function ProfileModal({ student, onClose }: { student: StudentProfile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{student.name}</h2>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              📌 Read-only view. Students manage their own profiles.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4">Identity</h3>
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

          <div className="h-px bg-border my-6" />

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4">Academics</h3>
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
            <>
              <div className="h-px bg-border my-6" />
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Resume</h3>
                <div className="rounded-md border border-border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground mb-2">File: {student.resumeFilename}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Uploaded: {student.resumeUploadedAt ? new Date(student.resumeUploadedAt).toLocaleDateString() : "—"}
                  </p>
                  <Button asChild size="sm">
                    <a href={student.resumeUrl} target="_blank" rel="noopener noreferrer">
                      View Resume <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </section>
            </>
          )}

          {student.skills.length > 0 && (
            <>
              <div className="h-px bg-border my-6" />
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {student.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">{skill.name}</Badge>
                  ))}
                </div>
              </section>
            </>
          )}

          {student.projects.length > 0 && (
            <>
              <div className="h-px bg-border my-6" />
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Projects ({student.projects.length})</h3>
                <div className="space-y-3">
                  {student.projects.map((p, i) => (
                    <div key={i} className="rounded-md border border-border bg-muted/50 p-4">
                      <p className="font-semibold text-foreground">{p.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                      {p.techStack && p.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.techStack.map((tech, j) => (
                            <Badge key={j} variant="outline" className="text-xs">{tech}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {student.workExperience.length > 0 && (
            <>
              <div className="h-px bg-border my-6" />
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Work Experience ({student.workExperience.length})</h3>
                <div className="space-y-3">
                  {student.workExperience.map((exp, i) => (
                    <div key={i} className="rounded-md border border-border bg-muted/50 p-4">
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
            </>
          )}

          {student.certifications.length > 0 && (
            <>
              <div className="h-px bg-border my-6" />
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Certifications ({student.certifications.length})</h3>
                <div className="space-y-2">
                  {student.certifications.map((cert, i) => (
                    <div key={i} className="flex justify-between items-start rounded-md border border-border bg-muted/50 p-3">
                      <div>
                        <p className="font-semibold text-foreground">{cert.title}</p>
                        <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{cert.date}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {student.codingProfiles.length > 0 && (
            <>
              <div className="h-px bg-border my-6" />
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Coding Profiles ({student.codingProfiles.length})</h3>
                <div className="space-y-2">
                  {student.codingProfiles.map((profile, i) => (
                    <div key={i} className="rounded-md border border-border bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground">{profile.platform}</p>
                      <p className="text-foreground font-medium">{profile.username}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {student.researchPapers.length > 0 && (
            <>
              <div className="h-px bg-border my-6" />
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Research Papers ({student.researchPapers.length})</h3>
                <div className="space-y-2">
                  {student.researchPapers.map((paper, i) => (
                    <div key={i} className="rounded-md border border-border bg-muted/50 p-3">
                      <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary font-medium">
                        {paper.title}
                      </a>
                      <p className="text-sm text-muted-foreground">{paper.date}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {student.achievements.length > 0 && (
            <>
              <div className="h-px bg-border my-6" />
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Achievements ({student.achievements.length})</h3>
                <div className="space-y-3">
                  {student.achievements.map((ach, i) => (
                    <div key={i} className="rounded-md border border-border bg-muted/50 p-4">
                      <p className="font-semibold text-foreground">{ach.title}</p>
                      <p className="text-sm text-muted-foreground">{ach.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{ach.date}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {student.softSkills.length > 0 && (
            <>
              <div className="h-px bg-border my-6" />
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Soft Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {student.softSkills.map((skill, i) => (
                    <Badge key={i} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentSearchView({ 
  apiEndpoint,
  title = "Student Profiles",
  description = "Search and view student profiles for your college",
  headerActions
}: StudentSearchViewProps) {
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
    }
  }, [searchQuery, selectedBranch, selectedBatchYear, debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    performSearch(searchQuery, selectedBranch, selectedBatchYear, newPage);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {headerActions && <div>{headerActions}</div>}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or SAP ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <select
          value={selectedBranch}
          onChange={(e) => {
            setSelectedBranch(e.target.value);
            setCurrentPage(1);
          }}
          className="h-10 px-3 bg-card border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Branches</option>
          {branches.map((branch) => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>
        <select
          value={selectedBatchYear}
          onChange={(e) => {
            setSelectedBatchYear(e.target.value);
            setCurrentPage(1);
          }}
          className="h-10 px-3 bg-card border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Batch Years</option>
          {batchYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="h-px bg-border w-full" />

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground">Searching students...</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-md p-4">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-rose-600 dark:text-rose-400">{error}</div>
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            {searchQuery || selectedBranch !== "all" || selectedBatchYear !== "all"
              ? "No students found matching your criteria."
              : "Search to find student profiles"}
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, total)} of {total} results
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-card text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium text-foreground">SAP ID / Roll</th>
                  <th className="px-4 py-3 font-medium text-foreground">Student Info</th>
                  <th className="px-4 py-3 font-medium text-foreground">Course Info</th>
                  <th className="px-4 py-3 font-medium text-foreground">Performance</th>
                  <th className="px-4 py-3 font-medium text-foreground text-center">Profile</th>
                  <th className="px-4 py-3 font-medium text-right text-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((student, index) => (
                  <tr key={student.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                    <td className="px-4 py-3 align-middle font-mono text-xs">
                      <div className="text-foreground">{student.sapId || "—"}</div>
                      <div className="text-muted-foreground mt-0.5">{student.rollNo || "—"}</div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <p className="font-medium text-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{student.email}</p>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge variant="outline" className="text-[10px] py-0">{student.branch || "—"}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">Batch: {student.batchYear || "—"}</div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="font-mono text-sm">{student.cgpa ? student.cgpa.toFixed(2) : "—"}</div>
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-8 h-8 transform -rotate-90">
                          <circle cx="16" cy="16" r="14" strokeWidth="2" stroke="currentColor" fill="none" className="text-muted" />
                          <circle
                            cx="16" cy="16" r="14" strokeWidth="2" stroke="currentColor" fill="none"
                            strokeDasharray={2 * Math.PI * 14}
                            strokeDashoffset={2 * Math.PI * 14 * (1 - student.profileCompleteness / 100)}
                            className={student.profileCompleteness > 80 ? "text-green-500" : student.profileCompleteness > 40 ? "text-yellow-500" : "text-red-500"}
                          />
                        </svg>
                        <span className="absolute text-[9px] font-bold">{student.profileCompleteness}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStudent(student)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 20 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">Page {currentPage} of {Math.ceil(total / 20)}</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(total / 20)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedStudent && (
        <ProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}
