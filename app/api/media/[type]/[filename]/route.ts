import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { mimeTypeForExtension, UPLOADS_ROOT } from "@/lib/storage";

const FILENAME_PATTERN = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; filename: string }> },
) {
  const { type, filename } = await params;

  if (type !== "videos" && type !== "images") {
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
