import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireStudentProfile } from "@/lib/auth/helpers";
import { isRedirectError } from "next/dist/client/components/redirect";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractCloudinaryPublicIdWithExtension(fileUrl: string): string | null {
    if (!fileUrl || !fileUrl.includes("/upload/")) return null;

    const [withoutQuery] = fileUrl.split("?");
    const [, uploadPath = ""] = withoutQuery.split("/upload/");
    if (!uploadPath) return null;

    let normalized = uploadPath;
    if (normalized.startsWith("fl_attachment/")) {
        normalized = normalized.slice("fl_attachment/".length);
    }

    normalized = normalized.replace(/^v\d+\//, "").trim();
    return normalized || null;
}

function extensionFromMime(mime: string | null | undefined): string {
    const value = (mime || "").toLowerCase();
    if (value.includes("pdf")) return "pdf";
    if (value.includes("wordprocessingml.document")) return "docx";
    return "";
}

export async function GET() {
    try {
        const { profile } = await requireStudentProfile();

        if (!profile.resumeUrl) {
            return NextResponse.json({ error: "No resume uploaded" }, { status: 404 });
        }

        if (
            !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            return NextResponse.json(
                { error: "Cloudinary is not configured on the server." },
                { status: 500 },
            );
        }

        let publicIdWithExtension = extractCloudinaryPublicIdWithExtension(profile.resumeUrl);
        if (!publicIdWithExtension) {
            return NextResponse.json(
                { error: "Could not determine resume file path for download." },
                { status: 500 },
            );
        }

        const hasExtension = /\.[a-z0-9]+$/i.test(publicIdWithExtension);
        if (!hasExtension) {
            const ext = extensionFromMime(profile.resumeMime);
            if (ext) {
                publicIdWithExtension = `${publicIdWithExtension}.${ext}`;
            }
        }

        const expiresAt = Math.floor(Date.now() / 1000) + 300;
        const signedDownloadUrl = cloudinary.utils.private_download_url(
            publicIdWithExtension,
            "",
            {
                resource_type: "raw",
                type: "upload",
                attachment: true,
                expires_at: expiresAt,
            },
        );

        const response = NextResponse.redirect(signedDownloadUrl, { status: 302 });
        response.headers.set("Cache-Control", "private, no-store, max-age=0");
        return response;
    } catch (error) {
        if (isRedirectError(error)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        console.error("[Resume Download] Failed to generate signed URL:", error);
        return NextResponse.json(
            { error: "Failed to generate resume download link" },
            { status: 500 },
        );
    }
}
