import "dotenv/config";

import postgres from "postgres";
import { v2 as cloudinary } from "cloudinary";

import { extractCloudinaryPublicId } from "../lib/cloudinary";

type ResourceAttachmentRow = {
  id: string;
  attachment_url: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  if (
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary credentials are not configured");
  }

  const sql = postgres(process.env.DATABASE_URL, { prepare: false });

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  try {
    const rows = await sql<ResourceAttachmentRow[]>`
      SELECT id::text, attachment_url
      FROM resources
      WHERE attachment_url IS NOT NULL
      ORDER BY created_at ASC
    `;

    console.log(`[Cloudinary] Found ${rows.length} resources with attachments`);

    for (const row of rows) {
      const publicId = extractCloudinaryPublicId(row.attachment_url);

      if (!publicId) {
        skippedCount++;
        console.warn(`[Cloudinary] SKIP ${row.id}: could not parse public_id from URL`);
        continue;
      }

      try {
        await cloudinary.api.update(publicId, {
          access_mode: "public",
          resource_type: "raw",
        });

        successCount++;
        console.log(`[Cloudinary] OK   ${row.id} -> ${publicId}`);
      } catch (error: unknown) {
        failureCount++;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Cloudinary] FAIL ${row.id} -> ${publicId}: ${message}`);
      }

      // Cloudinary Admin API has strict per-second limits.
      await sleep(500);
    }
  } finally {
    await sql.end();
  }

  console.log("\n[Cloudinary] Migration summary:");
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed:  ${failureCount}`);
  console.log(`  Skipped: ${skippedCount}`);

  if (failureCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Cloudinary] Fatal error: ${message}`);
  process.exit(1);
});
