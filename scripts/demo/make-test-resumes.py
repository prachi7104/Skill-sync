"""Writes small, valid test resumes (fictional person) for guest-mode upload tests.

Usage: python scripts/demo/make-test-resumes.py
Output: playwright/fixtures/resumes/{fictional-resume.docx, not-a-resume.txt, disguised.pdf}
The DOCX is assembled by hand (no packages needed). The real PDF comes from
scripts/demo/make-test-resume-pdf.cjs, which prints the same lines with local
Chrome, because pdf-parse's bundled pdf.js 1.10 rejects hand-written xref tables.
"""
import os
import zipfile
from xml.sax.saxutils import escape

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "playwright", "fixtures", "resumes")

LINES = [
    "Riley Morgan (fictional test resume)",
    "riley.morgan@example.invalid",
    "Education: B.Tech Computer Science, Example Institute of Technology, 2023-2027, CGPA 8.4",
    "Skills: Python, TypeScript, React, Node.js, PostgreSQL, Docker, REST API, Git, SQL, Pandas",
    "Projects:",
    "Campus Events Portal - Built a React and Node.js web app with PostgreSQL to manage campus events for 2000 users.",
    "Sales Forecast Notebook - Used Python and Pandas to clean data and build a regression model for weekly sales.",
    "Experience: Software Intern, Example Startup (fictional), May 2025 - Jul 2025.",
    "Developed REST API endpoints in Node.js and wrote Docker files for local development.",
    "Certifications: Fictional Cloud Practitioner (test data).",
    "Achievements: Finalist, Example College Hackathon 2025.",
]


def write_docx(path: str) -> None:
    body = "".join(f'<w:p><w:r><w:t xml:space="preserve">{escape(l)}</w:t></w:r></w:p>' for l in LINES)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        z.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr("word/document.xml", f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{body}</w:body></w:document>')


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    write_docx(os.path.join(OUT, "fictional-resume.docx"))
    with open(os.path.join(OUT, "not-a-resume.txt"), "w") as f:
        f.write("plain text file, should be rejected\n")
    with open(os.path.join(OUT, "disguised.pdf"), "w") as f:
        f.write("This is not really a PDF but has a .pdf extension. " * 5)
    print("wrote", sorted(os.listdir(OUT)))
