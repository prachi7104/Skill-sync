type OnboardingProfile = Partial<{
  rollNo: string | null;
  cgpa: number | null;
  branch: string | null;
  batchYear: number | null;
  tenthPercentage: number | null;
  twelfthPercentage: number | null;
}>;

const fieldCheckers: Array<(profile: OnboardingProfile | undefined) => boolean> = [
  (profile) => Boolean(profile?.rollNo),
  (profile) => typeof profile?.cgpa === "number",
  (profile) => Boolean(profile?.branch),
  (profile) => typeof profile?.batchYear === "number",
  (profile) => typeof profile?.tenthPercentage === "number",
  (profile) => typeof profile?.twelfthPercentage === "number",
];

export function computeOnboardingProgress(profile: OnboardingProfile | null | undefined) {
  const statuses = fieldCheckers.map((checker) => checker(profile ?? undefined));
  const completed = statuses.filter(Boolean).length;
  const percentage = Math.round((completed / fieldCheckers.length) * 100);
  const onboardingRequired = completed < fieldCheckers.length;
  return { progress: percentage, onboardingRequired };
}
