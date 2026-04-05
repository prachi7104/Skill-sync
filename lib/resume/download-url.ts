export function toResumeDownloadUrl(url: string): string {
  if (!url) return url;
  return "/api/student/resume/download";
}
