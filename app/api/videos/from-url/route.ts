import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  FileTooLargeError,
  InvalidSourceUrlError,
  MAX_VIDEO_SIZE_BYTES,
  saveFileFromUrl,
  SourceFetchFailedError,
  UnsupportedMediaTypeError,
} from "@/lib/storage";

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
    const { url } = await saveFileFromUrl(
      sourceUrl,
      "videos",
      MAX_VIDEO_SIZE_BYTES,
      ALLOWED_VIDEO_MIME_TYPES,
    );

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
  } catch (error) {
    if (error instanceof FileTooLargeError) {
      return NextResponse.json({ error: "Video exceeds the 100MB size limit" }, { status: 413 });
    }
    if (error instanceof UnsupportedMediaTypeError) {
      return NextResponse.json({ error: "Unsupported video type" }, { status: 415 });
    }
    if (error instanceof InvalidSourceUrlError) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }
    if (error instanceof SourceFetchFailedError) {
      return NextResponse.json({ error: "Could not fetch video from url" }, { status: 502 });
    }
    throw error;
  }
}
