import { beforeEach, describe, expect, it, vi } from "vitest";

type MockProfile = {
  id: string;
  onboardingStep: number;
  profileCompleteness?: number;
};

async function loadActions(options: {
  profile: MockProfile;
  freshProfile?: Record<string, unknown> | null;
  completenessScore?: number;
}) {
  const mockRequireRole = vi.fn().mockResolvedValue({
    id: "student-1",
    role: "student",
    collegeId: "college-1",
    name: "Student One",
    email: "student1@stu.upes.ac.in",
  });

  const mockGetStudentProfile = vi.fn().mockResolvedValue(options.profile);

  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn(() => ({ where: mockWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));

  const mockFindStudent = vi
    .fn()
    .mockResolvedValue(options.freshProfile ?? options.profile);

  vi.doMock("@/lib/auth/helpers", () => ({
    requireRole: mockRequireRole,
    getStudentProfile: mockGetStudentProfile,
    requireStudentProfile: vi.fn().mockResolvedValue({
      user: {
        id: "student-1",
        name: "Student One",
        email: "student1@stu.upes.ac.in",
      },
      profile: options.profile,
    }),
  }));

  vi.doMock("@/lib/db", () => ({
    db: {
      insert: vi.fn(() => ({ values: vi.fn(), onConflictDoNothing: vi.fn() })),
      update: mockUpdate,
      query: {
        students: {
          findFirst: mockFindStudent,
        },
        jobs: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    },
  }));

  vi.doMock("@/lib/profile/completeness", () => ({
    computeCompleteness: vi
      .fn()
      .mockReturnValue({ score: options.completenessScore ?? 75 }),
  }));

  vi.doMock("next/cache", () => ({
    revalidatePath: vi.fn(),
  }));

  vi.doMock("@/lib/workers/generate-embedding", () => ({
    processEmbeddingJobs: vi.fn().mockResolvedValue(undefined),
  }));

  const mod = await import("@/app/actions/onboarding");

  return {
    ...mod,
    mockSet,
    mockWhere,
  };
}

describe("onboarding actions - real module behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rejects skipped forward transitions", async () => {
    const { updateOnboardingStep } = await loadActions({
      profile: { id: "student-1", onboardingStep: 2 },
    });

    await expect(updateOnboardingStep(5)).rejects.toThrow(
      "Invalid step transition",
    );
  });

  it("allows backward transitions to correct mistakes", async () => {
    const { updateOnboardingStep, mockSet } = await loadActions({
      profile: { id: "student-1", onboardingStep: 3 },
    });

    await expect(updateOnboardingStep(2)).resolves.toEqual({ success: true });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingStep: 2 }),
    );
  });

  it("treats completeOnboarding as idempotent when already complete", async () => {
    const { completeOnboarding } = await loadActions({
      profile: {
        id: "student-1",
        onboardingStep: 10,
        profileCompleteness: 82,
      },
    });

    await expect(completeOnboarding()).resolves.toEqual({
      success: true,
      completeness: 82,
    });
  });

  it("completes onboarding from step 9 and persists completion step", async () => {
    const { completeOnboarding, mockSet } = await loadActions({
      profile: {
        id: "student-1",
        onboardingStep: 9,
        profileCompleteness: 40,
      },
      freshProfile: {
        id: "student-1",
        onboardingStep: 9,
        profileCompleteness: 40,
      },
      completenessScore: 77,
    });

    const result = await completeOnboarding();
    expect(result).toEqual({ success: true, completeness: 77 });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingStep: 10,
        profileCompleteness: 77,
      }),
    );
  });
});
