import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  deleteUploadedFileByUrl,
  extensionForMimeType,
  MAX_IMAGE_SIZE_BYTES,
  saveUploadedFile,
} from "@/lib/storage";

/**
 * @swagger
 * /api/user/image:
 *   post:
 *     tags: [Users]
 *     description: >
 *       Direct upload (multipart/form-data, "file" field) of a new avatar for the
 *       logged-in user. The previous image, if any, is deleted from disk after
 *       replacement.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Avatar updated.
 *       400:
 *         description: Missing file.
 *       401:
 *         description: No session.
 *       413:
 *         description: Image exceeds the 5MB size limit.
 *       415:
 *         description: Unsupported image type.
 */
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
