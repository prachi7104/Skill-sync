import "dotenv/config";

import { v2 as cloudinary } from "cloudinary";
import postgres from "postgres";

import { extractCloudinaryPublicId } from "../lib/cloudinary";

type ResourceAttachmentRow = {
  id: string;
  attachment_url: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function verifyCloudinaryConnection() {
  try {
    const pingResponse = await cloudinary.api.ping() as { status?: string };
    if (pingResponse.status !== "ok") {
      throw new Error(`Unexpected ping response: ${JSON.stringify(pingResponse)}`);
    }

    console.log("[Cloudinary] Ping OK");
  } catch (error: unknown) {
    throw new Error(
      "Cloudinary ping failed. Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET. " +
        `Original error: ${toErrorMessage(error)}`,
    );
  }
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

  await verifyCloudinaryConnection();

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
        console.error(`[Cloudinary] FAIL ${row.id} -> ${publicId}: ${toErrorMessage(error)}`);
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
  console.error(`[Cloudinary] Fatal error: ${toErrorMessage(error)}`);
  process.exit(1);
});
