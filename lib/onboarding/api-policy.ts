export type StudentApiOnboardingPolicy = "allow-during-onboarding" | "require-complete";

export const STUDENT_API_ONBOARDING_POLICY_MATRIX: Array<{
  prefix: string;
  policy: StudentApiOnboardingPolicy;
}> = [
  { prefix: "/api/student/profile", policy: "allow-during-onboarding" },
  { prefix: "/api/student/resume", policy: "allow-during-onboarding" },
  { prefix: "/api/student/resume/preview", policy: "allow-during-onboarding" },
  { prefix: "/api/student/resume/download", policy: "allow-during-onboarding" },
  { prefix: "/api/student/profile/merge", policy: "allow-during-onboarding" },
  { prefix: "/api/student/profile/completeness", policy: "allow-during-onboarding" },
  { prefix: "/api/student", policy: "require-complete" },
];

export function resolveStudentApiOnboardingPolicy(pathname: string): StudentApiOnboardingPolicy {
  const matched = STUDENT_API_ONBOARDING_POLICY_MATRIX
    .slice()
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((entry) => pathname.startsWith(entry.prefix));

  return matched?.policy ?? "require-complete";
}
