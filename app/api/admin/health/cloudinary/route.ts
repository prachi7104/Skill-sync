import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { ApiAuthError, requireApiRole } from "@/lib/auth/api-guards";

export const maxDuration = 10;

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    await requireApiRole(["admin"]);
    const result = await cloudinary.api.ping();
    return NextResponse.json({ status: "ok", result });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ status: "error", error: error.message }, { status: error.status });
    }
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}
