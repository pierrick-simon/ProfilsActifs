import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteUploadedFileByUrl, extensionForMimeType, saveUploadedFile } from "@/lib/storage";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MO
const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image exceeds the 5MB size limit" },
      { status: 413 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image exceeds the 5MB size limit" },
      { status: 413 },
    );
  }

  if (!extensionForMimeType(file.type) || !ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
  }

  const previousUser = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { image: true },
  });

  const { url } = await saveUploadedFile(file, "images");

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { image: url },
    select: { id: true, image: true },
  });

  await deleteUploadedFileByUrl(previousUser.image);

  return NextResponse.json(user, { status: 200 });
}
