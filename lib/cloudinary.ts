import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadRawFileToCloudinary({
  buffer,
  folder,
  publicId,
  format,
}: {
  buffer: Buffer;
  folder: string;
  publicId: string;
  format: string;
}): Promise<{ secureUrl: string }> {
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
        access_mode: "public",
        public_id: publicId,
        overwrite: true,
        format,
      },
      (error, uploadResult) => {
        if (error || !uploadResult?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ secure_url: uploadResult.secure_url });
      },
    );

    uploadStream.end(buffer);
  });

  return { secureUrl: result.secure_url };
}

export function extractCloudinaryPublicId(fileUrl: string): string | null {
  if (!fileUrl || !fileUrl.includes("/upload/")) return null;

  const [withoutQuery] = fileUrl.split("?");
  const [, uploadPath = ""] = withoutQuery.split("/upload/");
  if (!uploadPath) return null;

  let normalized = uploadPath;
  if (normalized.startsWith("fl_attachment/")) {
    normalized = normalized.slice("fl_attachment/".length);
  }

  normalized = normalized.replace(/^v\d+\//, "");
  if (!normalized) return null;

  const segments = normalized.split("/").filter(Boolean);
  return segments.length === 0 ? null : segments.join("/");
}

export async function deleteCloudinaryRawByUrl(fileUrl: string): Promise<void> {
  const publicId = extractCloudinaryPublicId(fileUrl);
  if (!publicId) return;

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
    invalidate: true,
  }) as { result?: string };

  if (result?.result !== "ok" && result?.result !== "not found") {
    throw new Error(`Cloudinary delete failed: ${result?.result ?? "unknown"}`);
  }
}

export function toCloudinaryAttachmentUrl(url: string): string {
  if (!url) return url;
  if (!url.includes("/upload/")) return url;
  if (url.includes("/upload/fl_attachment/")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}