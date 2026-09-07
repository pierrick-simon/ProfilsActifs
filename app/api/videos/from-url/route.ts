import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  FileTooLargeError,
  fetchRemoteMedia,
  InvalidSourceUrlError,
  MAX_VIDEO_SIZE_BYTES,
  SourceFetchFailedError,
  UnsupportedMediaTypeError,
} from "@/lib/storage";
import { getActiveVideoProvider } from "@/lib/video-provider";
import { resolveVideoPlayback } from "@/lib/videos";

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
    const { bytes, mimeType } = await fetchRemoteMedia(
      sourceUrl,
      MAX_VIDEO_SIZE_BYTES,
      ALLOWED_VIDEO_MIME_TYPES,
    );

    const provider = getActiveVideoProvider();
    const providerId = await provider.store({ bytes, mimeType });
    const initialStatus = await provider.status(providerId);

    const video = await prisma.video.create({
      data: {
        id: randomUUID(),
        provider: provider.name,
        providerId,
        status: initialStatus.status.toUpperCase() as "PENDING" | "READY" | "FAILED",
        userId: session.user.id,
        views: 0,
        validated: false,
      },
    });

    const playback = await resolveVideoPlayback(video);
    return NextResponse.json(
      { ...video, url: playback.url, status: playback.status },
      { status: 201 },
    );
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
