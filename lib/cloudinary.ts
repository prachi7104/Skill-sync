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