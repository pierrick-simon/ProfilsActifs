import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  deleteUploadedFileByUrl,
  FileTooLargeError,
  InvalidSourceUrlError,
  MAX_IMAGE_SIZE_BYTES,
  saveFileFromUrl,
  SourceFetchFailedError,
  UnsupportedMediaTypeError,
} from "@/lib/storage";

/**
 * @swagger
 * /api/user/image/from-url:
 *   post:
 *     tags: [Users]
 *     description: >
 *       Sets the logged-in user's avatar from a remote URL (the server downloads
 *       the image itself). The previous image, if any, is deleted from disk after
 *       replacement.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url: { type: string }
 *     responses:
 *       200:
 *         description: Avatar updated.
 *       400:
 *         description: Missing or invalid URL.
 *       401:
 *         description: No session.
 *       413:
 *         description: Image exceeds the 5MB size limit.
 *       415:
 *         description: Unsupported image type.
 *       502:
 *         description: Failed to download from the provided URL.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const sourceUrl = body?.url;
  if (typeof sourceUrl !== "string" || !sourceUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const previousUser = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { image: true },
    });

    const { url } = await saveFileFromUrl(
      sourceUrl,
      "images",
      MAX_IMAGE_SIZE_BYTES,
      ALLOWED_IMAGE_MIME_TYPES,
    );

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: url },
      select: { id: true, image: true },
    });

    await deleteUploadedFileByUrl(previousUser.image);

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    if (error instanceof FileTooLargeError) {
      return NextResponse.json({ error: "Image exceeds the 5MB size limit" }, { status: 413 });
    }
    if (error instanceof UnsupportedMediaTypeError) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
    }
    if (error instanceof InvalidSourceUrlError) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }
    if (error instanceof SourceFetchFailedError) {
      return NextResponse.json({ error: "Could not fetch image from url" }, { status: 502 });
    }
    throw error;
  }
}
