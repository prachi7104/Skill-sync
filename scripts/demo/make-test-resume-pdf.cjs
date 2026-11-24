/**
 * Prints playwright/fixtures/resumes/fictional-resume.pdf (fictional person) with
 * local Chrome, using the same lines as make-test-resumes.py.
 * Usage: node scripts/demo/make-test-resume-pdf.cjs
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const source = fs.readFileSync(path.join(__dirname, "make-test-resumes.py"), "utf8");
  const lines = [...source.matchAll(/^    "(.*)",$/gm)].map((m) => m[1]);
  const escape = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();
  await page.setContent(`<body style="font-family:Arial;font-size:12px">${lines.map((l) => `<p>${escape(l)}</p>`).join("")}</body>`);
  await page.pdf({ path: path.join(__dirname, "..", "..", "playwright", "fixtures", "resumes", "fictional-resume.pdf"), format: "A4" });
  await browser.close();
  console.log(`wrote fictional-resume.pdf (${lines.length} lines)`);
})();
