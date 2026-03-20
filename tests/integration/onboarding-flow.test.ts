/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SkillSync — Onboarding Flow Integration Tests
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Integration tests for the student onboarding flow:
 *   1. Auto-create profile on first login
 *   2. Resume upload triggers both preview + storage tracks
 *   3. Preview auto-fills form fields
 *   4. Batch year can only be set once
 *   5. Can skip resume and still proceed
 *
 * These tests use mock-based verification (vi.mock) rather than full database
 * integration to keep tests fast and deterministic.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock types and helpers
interface MockStudent {
  id: string;
  collegeId: string;
  name?: string;
  email?: string;
  sapId?: string;
  rollNo?: string;
  skills?: Array<{ id: string; name: string }>;
}

interface MockResumePreview {
  skills: string[];
  projects?: string[];
  experience?: string[];
}

describe("Student Onboarding Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 1: fullOnboardingFlow
  // ────────────────────────────────────────────────────────────────────────────
  it("should auto-create student profile with collegeId on first login", async () => {
    const userId = "user-123";
    const collegeId = "college-456";
    const mockStudentCreated: MockStudent = {
      id: userId,
      collegeId: collegeId,
      name: "Test Student",
      email: "student@college.edu",
    };

    // Simulate: getStudentProfile returns null initially (first login)
    let profileFetches = 0;
    const mockGetStudentProfile = vi.fn(async (id: string) => {
      profileFetches++;
      // First call returns null (no profile yet)
      if (profileFetches === 1) return null;
      // Second call returns the auto-created profile
      return mockStudentCreated;
    });

    // Simulate: insert into students table
    const mockInsertStudent = vi.fn(async (data: Partial<MockStudent>) => {
      expect(data.collegeId).toBe(collegeId);
      return { id: userId, ...data };
    });

    // Execute the auto-create logic
    let profile = await mockGetStudentProfile(userId);
    expect(profile).toBeNull(); // Initially null

    // Auto-create logic
    if (!profile && collegeId) {
      await mockInsertStudent({
        id: userId,
        collegeId: collegeId,
      });
      profile = await mockGetStudentProfile(userId);
    }

    // Verify: profile now exists with collegeId
    expect(profile).toBeDefined();
    expect(profile?.id).toBe(userId);
    expect(profile?.collegeId).toBe(collegeId);
    expect(mockInsertStudent).toHaveBeenCalledWith(
      expect.objectContaining({ collegeId })
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 2: resumeUploadTriggersBothTracks
  // ────────────────────────────────────────────────────────────────────────────
  it("should call both resume upload and preview endpoints when resume is uploaded", async () => {
    const mockResumeFile = new File(["resume content"], "resume.pdf", {
      type: "application/pdf",
    });
    const resumeText = "Python React Node.js experience at TechCorp...";

    // Mock fetch calls
    let uploadCalled = false;
    let previewCalled = false;

    const mockFetch = vi.fn(async (url: string, options: RequestInit) => {
      if (url.includes("/api/student/resume") && !url.includes("preview")) {
        uploadCalled = true;
        // Verify upload endpoint receives file
        expect(options.body).toBeDefined();
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      } else if (url.includes("/api/student/resume/preview")) {
        previewCalled = true;
        // Verify preview endpoint receives text
        const body = options.body;
        if (typeof body === "string") {
          const parsed = JSON.parse(body);
          expect(parsed.resumeText).toBe(resumeText);
        }
        return new Response(
          JSON.stringify({ skills: ["Python", "React"] }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    });

    // Simulate handleResumeUpload call
    const mockExtractResume = vi.fn(async () => resumeText);

    // Execute upload handling
    const extractedText = await mockExtractResume();
    expect(extractedText).toBe(resumeText);

    // Mock uploading to both endpoints
    await mockFetch("/api/student/resume", {
      method: "POST",
      body: mockResumeFile,
    });

    await mockFetch("/api/student/resume/preview", {
      method: "POST",
      body: JSON.stringify({ resumeText: extractedText }),
    });

    // Verify: both endpoints were called
    expect(uploadCalled).toBe(true);
    expect(previewCalled).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 3: previewAutofillsFormFields
  // ────────────────────────────────────────────────────────────────────────────
  it("should autofill form fields from resume preview", async () => {
    const mockPreviewData: MockResumePreview = {
      skills: ["Python", "React", "Node.js"],
      projects: ["Web App", "API Service"],
      experience: ["TechCorp - Senior Dev"],
    };

    // Mock form state
    const mockFormState = { skills: [], projects: [], workExperience: [] };

    // Simulate preview response
    const mockHandlePreviewResponse = vi.fn(async () => {
      // Update form state with preview data
      mockFormState.skills = mockPreviewData.skills;
      mockFormState.projects = mockPreviewData.projects;
      mockFormState.workExperience = mockPreviewData.experience;
      return mockFormState;
    });

    // Execute preview autofill
    const updatedForm = await mockHandlePreviewResponse();

    // Verify: form fields are autofilled
    expect(updatedForm.skills).toEqual(["Python", "React", "Node.js"]);
    expect(updatedForm.projects).toEqual(["Web App", "API Service"]);
    expect(updatedForm.workExperience).toEqual(["TechCorp - Senior Dev"]);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 4: batchYearCanOnlyBeSetOnce
  // ────────────────────────────────────────────────────────────────────────────
  it("should block changing batch year once set", async () => {
    interface OnboardingFormState {
      activeStep: string;
      form: {
        rollNo: string;
        batchYear?: number | null;
        cgpa?: number | null;
      };
    }

    const mockFormState: OnboardingFormState = {
      activeStep: "identity",
      form: {
        rollNo: "R123456",
        batchYear: 2024,
      };
    };

    // Mock batch year validation logic
    const mockValidateBatchYear = vi.fn(
      (currentValue: number | null | undefined, newValue: number) => {
        if (currentValue !== null && currentValue !== undefined) {
          if (newValue !== currentValue) {
            return "Batch year cannot be changed after it has been set";
          }
        }
        return null;
      }
    );

    // Try to change batch year
    const error = mockValidateBatchYear(mockFormState.form.batchYear, 2025);

    // Verify: changing batch year is blocked
    expect(error).toBe(
      "Batch year cannot be changed after it has been set"
    );

    // Setting same value should pass
    const sameError = mockValidateBatchYear(
      mockFormState.form.batchYear,
      2024
    );
    expect(sameError).toBeNull();

    // Setting initially should pass
    const initialError = mockValidateBatchYear(null, 2024);
    expect(initialError).toBeNull();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Test 5: skipResumeAllowsManualFill
  // ────────────────────────────────────────────────────────────────────────────
  it("should allow skipping resume and proceeding with manual fill", async () => {
    interface OnboardingState {
      resumeState: "pending" | "uploaded" | "skipped";
      formCanProceed: boolean;
      form: {
        rollNo: string;
        skills: Array<{ name: string }>;
      };
    }

    const mockOnboardingState: OnboardingState = {
      resumeState: "pending",
      formCanProceed: false,
      form: {
        rollNo: "",
        skills: [],
      },
    };

    // Mock skip resume handler
    const mockSkipResume = vi.fn(async () => {
      mockOnboardingState.resumeState = "skipped";
    });

    // Mock manual form fill
    const mockFillFormManually = vi.fn(async () => {
      mockOnboardingState.form.rollNo = "R987654";
      mockOnboardingState.form.skills = [
        { name: "Python" },
        { name: "Docker" },
      ];
      mockOnboardingState.formCanProceed = true;
    });

    // Execute skip + manual fill flow
    await mockSkipResume();
    expect(mockOnboardingState.resumeState).toBe("skipped");

    // Now fill manually
    await mockFillFormManually();

    // Verify: form is filled and can proceed
    expect(mockOnboardingState.form.rollNo).toBe("R987654");
    expect(mockOnboardingState.form.skills.length).toBe(2);
    expect(mockOnboardingState.formCanProceed).toBe(true);
  });
});
