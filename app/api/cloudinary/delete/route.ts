import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary/server";

export async function POST(request: Request) {
  if (!process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json(
      { error: "Cloudinary environment variables are not configured" },
      { status: 500 },
    );
  }

  const { publicId } = (await request.json()) as { publicId: string };

  const result = await cloudinary.uploader.destroy(publicId);

  if (result.result !== "ok" && result.result !== "not found") {
    return NextResponse.json(
      { error: `Cloudinary delete failed: ${result.result}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
