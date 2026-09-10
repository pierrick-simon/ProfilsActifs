import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { mimeTypeForExtension, UPLOADS_ROOT } from "@/lib/storage";

const FILENAME_PATTERN = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/;

/**
 * @swagger
 * /api/media/{type}/{filename}:
 *   get:
 *     tags: [Media]
 *     description: >
 *       Serves a public media file uploaded to disk. Only type="images" is
 *       accepted: videos are intentionally excluded from this route and only ever
 *       go through /api/videos/stream/{providerId}, which checks rights.
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema: { type: string, enum: [images] }
 *       - in: path
 *         name: filename
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Image file bytes, cached indefinitely on the client.
 *       404:
 *         description: Unsupported type, invalid filename, or file not found.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; filename: string }> },
) {
  const { type, filename } = await params;

  // Videos are intentionally excluded: they are only ever served through the
  // rights-checked /api/videos/stream/[providerId] route. Only images (avatars),
  // which are meant to be publicly viewable, still go through this route.
  if (type !== "images") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!FILENAME_PATTERN.test(filename)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const extension = filename.split(".").pop()!;
  const mimeType = mimeTypeForExtension(extension);
  if (!mimeType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await readFile(path.join(UPLOADS_ROOT, type, filename));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
