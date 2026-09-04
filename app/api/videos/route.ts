import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extensionForMimeType, saveUploadedFile } from "@/lib/storage";

const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MO
const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/ogg",
];

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_VIDEO_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Video exceeds the 100MB size limit" },
      { status: 413 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Video exceeds the 100MB size limit" },
      { status: 413 },
    );
  }

  if (!extensionForMimeType(file.type) || !ALLOWED_VIDEO_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported video type" }, { status: 415 });
  }

  const { url } = await saveUploadedFile(file, "videos");

  const video = await prisma.video.create({
    data: {
      id: randomUUID(),
      url,
      userId: session.user.id,
      views: 0,
      validated: false,
    },
  });

  return NextResponse.json(video, { status: 201 });
}
