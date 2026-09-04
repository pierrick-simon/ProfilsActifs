import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  extensionForMimeType,
  MAX_VIDEO_SIZE_BYTES,
  saveUploadedFile,
} from "@/lib/storage";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get("userId");
  const isOwnVideos = requestedUserId === session.user.id;
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20) || 20, 50);

  const videos = await prisma.video.findMany({
    where: {
      ...(requestedUserId ? { userId: requestedUserId } : {}),
      ...(isOwnVideos ? {} : { validated: true }),
    },
    orderBy: { id: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      url: true,
      views: true,
      validated: true,
      userId: true,
      user: { select: { id: true, name: true, image: true } },
    },
  });

  const hasMore = videos.length > limit;
  const items = hasMore ? videos.slice(0, limit) : videos;

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

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
