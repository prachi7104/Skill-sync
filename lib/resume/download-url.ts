export function toResumeDownloadUrl(url: string): string {
  if (!url) return url;
  if (!url.includes("/upload/")) return url;
  if (url.includes("/upload/fl_attachment/")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}
