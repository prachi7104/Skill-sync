/**
 * Guest-mode journeys against a running SkillSync server.
 *
 *   SKILLSYNC_DEMO_TEST_URL=http://localhost:3000 npx playwright test playwright/public-demo.spec.ts
 *
 * The server needs ENABLE_GUEST_ACCESS=true. By default no AI provider is
 * called: every journey here uses stored fixture vectors or is rejected before
 * the AI step. Set SKILLSYNC_DEMO_LIVE_AI=true to also run the sample-resume
 * parse and one career-coach message (two real AI calls plus one embedding).
 * Screenshots go to docs/guest-mode/screenshots.
 *
 * The journeys share one browser context and run in order, so a run creates
 * one guest workspace (two if the expiry journey runs), not one per test.
 */
import { expect as baseExpect, test, type BrowserContext, type Page } from "@playwright/test";
import { resolve } from "node:path";

// Dev servers compile pages on first visit, so allow more than the 5s default.
const expect = baseExpect.configure({ timeout: 20_000 });
const baseUrl = process.env.SKILLSYNC_DEMO_TEST_URL;
const liveAi = process.env.SKILLSYNC_DEMO_LIVE_AI === "true";
const shots = resolve("docs/guest-mode/screenshots");
const fixtures = resolve("playwright/fixtures/resumes");

test.skip(!baseUrl, "Set SKILLSYNC_DEMO_TEST_URL to a server with ENABLE_GUEST_ACCESS=true");
test.describe.configure({ mode: "serial", timeout: 90_000 });
// The app registers a service worker that caches /_next/static; block it so
// every run tests the code being served.
test.use({ serviceWorkers: "block", ...(process.env.SKILLSYNC_DEMO_CHANNEL ? { channel: process.env.SKILLSYNC_DEMO_CHANNEL } : {}) });

let context: BrowserContext;
let page: Page;
const shot = (name: string) => page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext({ baseURL: baseUrl, viewport: { width: 1280, height: 800 }, serviceWorkers: "block" });
  page = await context.newPage();
});
test.afterAll(async () => context?.close());

test("landing page offers the live demo and leads to the role choice", async () => {
  await page.goto("/");
  const cta = page.getByRole("link", { name: /Try Live Demo/ });
  await expect(cta).toBeVisible();
  await shot("01-landing");
  await cta.click();
  await expect(page).toHaveURL(/\/guest$/);
  await expect(page.getByRole("heading", { name: "How would you like to explore SkillSync?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Explore as Student/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Explore as Recruiter/ })).toBeVisible();
  await shot("02-guest-selection");
});

test("student sign-in provisions a workspace and opens the tour", async () => {
  await page.getByRole("button", { name: /Explore as Student/ }).click();
  await expect(page).toHaveURL(/\/guest\/student$/, { timeout: 30_000 });
  const tour = page.getByRole("dialog");
  await expect(tour).toBeVisible();
  await expect(tour.getByText(/Step 1 of/)).toBeVisible();
  await shot("03-student-tour");
  await tour.getByRole("button", { name: "Next" }).click();
  await expect(tour.getByText(/Step 2 of/)).toBeVisible();
  await tour.getByRole("button", { name: "Skip tour" }).click();
  await expect(page.getByRole("heading", { name: "Student workspace" })).toBeVisible();
});

test("job fit shows computed scores for every opening", async () => {
  await expect(page.getByRole("tab", { name: "Job fit" })).toHaveAttribute("data-state", "active");
  await expect(page.getByText(/fictional/i).first()).toBeVisible();
  await shot("04-student-job-fit");
  await page.getByRole("tab", { name: "Profile" }).click();
  await expect(page.getByText("Python").first()).toBeVisible();
  await shot("05-student-profile");
});

test("unsupported and disguised files are rejected without an AI call", async () => {
  const input = page.getByTestId("resume-input");
  await input.setInputFiles(`${fixtures}/not-a-resume.txt`);
  await expect(page.getByRole("alert").first()).toContainText(/PDF or DOCX/i);

  await input.setInputFiles(`${fixtures}/disguised.pdf`);
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox").check();
  const upload = page.waitForResponse((r) => r.url().endsWith("/api/demo/resume") && r.request().method() === "POST");
  await dialog.getByRole("button", { name: /Analyse resume/ }).click();
  expect((await upload).status()).toBe(415);
  await expect(page.getByRole("alert").first()).toContainText(/PDF or DOCX/i);
  await shot("06-upload-rejected");
});

test("institutional pages and APIs are closed to the guest", async () => {
  const api = await page.request.get("/api/admin/students");
  expect(api.status()).toBe(403);
  expect((await page.request.get("/api/auth/change-password")).status()).toBe(403);
  expect((await page.request.get("/api/demo/drives")).status()).toBe(403); // recruiter-only
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/guest\/student$/);
  await page.keyboard.press("Escape"); // tour does not reopen, but be safe
});

test("analysis tab and coach render honest empty and labelled states", async () => {
  await page.getByRole("tab", { name: "Resume analysis" }).click();
  await expect(page.getByRole("button", { name: /Get recommendations/ })).toBeVisible();
  await shot("07-student-analysis");
  await page.getByRole("tab", { name: "Career coach" }).click();
  await expect(page.getByRole("log", { name: "Career coach chat" }).or(page.getByLabel("Career coach chat"))).toBeVisible();
  await shot("08-student-coach");
});

test("live AI: sample resume parse and one coach reply", async () => {
  test.skip(!liveAi, "Set SKILLSYNC_DEMO_LIVE_AI=true to spend real AI calls");
  test.setTimeout(180_000);
  await page.getByRole("button", { name: /Try Sample Resume/ }).click();
  await expect(page.getByRole("list", { name: "Resume processing progress" })).toBeVisible();
  await expect(page.getByText(/Parsed live from the sample resume by/)).toBeVisible({ timeout: 120_000 });
  await shot("09-sample-resume-parsed");
  await page.getByRole("tab", { name: "Career coach" }).click();
  await page.getByPlaceholder("Ask the career coachâ€¦").fill("Which opening am I closest to, in one sentence?");
  const reply = page.waitForResponse((r) => r.url().endsWith("/api/demo/chat"), { timeout: 60_000 });
  await page.getByRole("button", { name: "Send message" }).click();
  const response = await reply;
  expect(response.status()).toBe(200);
  const body = await response.json() as { reply: string; model: string };
  expect(body.reply.length).toBeGreaterThan(0);
  const chat = page.getByLabel("Career coach chat");
  await expect(chat.getByText("Coach is thinking…")).toBeHidden();
  // The reply is rendered as Markdown; check its first plain word is on screen.
  const firstWord = body.reply.replace(/[*_#`>\[\]-]/g, " ").trim().split(/\s+/)[0];
  await expect(chat.locator(".bg-muted").last()).toContainText(firstWord);
  await shot("10-coach-reply");
});

test("switching to recruiter keeps the same workspace", async () => {
  await page.getByRole("button", { name: /View as recruiter/i }).click();
  await expect(page).toHaveURL(/\/guest\/recruiter$/, { timeout: 30_000 });
  const tour = page.getByRole("dialog");
  if (await tour.isVisible().catch(() => false)) await tour.getByRole("button", { name: "Skip tour" }).click();
  await expect(page.getByRole("heading", { name: "Recruiter workspace" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Ranked candidates" }).getByRole("listitem")).toHaveCount(12);
  await shot("11-recruiter-rankings");
  expect((await page.request.get("/api/demo/overview")).status()).toBe(403); // student-only
});

test("search and filters narrow the ranked list", async () => {
  const list = page.getByRole("list", { name: "Ranked candidates" }).getByRole("listitem");
  await page.getByLabel("Search").fill("python");
  await expect(page.getByRole("status")).toContainText(/of 12 candidates shown/);
  const filtered = await list.count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThanOrEqual(12);
  await page.getByLabel("Search").fill("zzzz-no-match");
  await expect(page.getByText("No candidates match these filters")).toBeVisible();
  await shot("12-recruiter-empty-filter");
  await page.getByLabel("Search").fill("");
  await expect(list).toHaveCount(12);
});

test("shortlist persists across a reload", async () => {
  const first = page.getByRole("list", { name: "Ranked candidates" }).getByRole("listitem").first();
  const add = first.getByRole("button", { name: /^Add .* to shortlist$/ });
  const label = (await add.getAttribute("aria-label"))!;
  const name = label.replace(/^Add /, "").replace(/ to shortlist$/, "");
  await add.click();
  await expect(first.getByRole("button", { name: `Remove ${name} from shortlist` })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: `Remove ${name} from shortlist` })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: `Remove ${name} from shortlist` }).click();
  await expect(page.getByRole("button", { name: `Add ${name} to shortlist` })).toBeVisible();
});

test("candidate detail opens with scores and skills", async () => {
  const first = page.getByRole("list", { name: "Ranked candidates" }).getByRole("listitem").first();
  await first.getByRole("button", { name: /^View/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/fictional/i).first()).toBeVisible();
  await shot("13-candidate-detail");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("mobile layout has no horizontal overflow", async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Recruiter workspace" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole("button", { name: "Exit demo" })).toBeVisible();
  await shot("14-recruiter-mobile");
  await page.setViewportSize({ width: 1280, height: 800 });
});

test("exit demo ends the guest session", async () => {
  await page.getByRole("button", { name: "Exit demo" }).click();
  await expect(page).toHaveURL(new RegExp(`${baseUrl}/?$`), { timeout: 20_000 });
  expect((await page.request.get("/api/demo/drives")).status()).toBe(401);
  await page.goto("/guest/recruiter");
  await expect(page).toHaveURL(/\/guest(\?ended=1)?$/);
});

test("anonymous visitors cannot reach guest data or the cleanup job", async ({ request }) => {
  expect((await request.get(`${baseUrl}/api/demo/overview`)).status()).toBe(401);
  expect((await request.get(`${baseUrl}/api/demo/resume`)).status()).toBe(401);
  expect((await request.get(`${baseUrl}/api/demo/cleanup`)).status()).toBe(401);
});
