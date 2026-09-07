import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteVideoRecord, resolveVideoPlayback } from "@/lib/videos";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.validated !== "boolean") {
    return NextResponse.json({ error: "Missing validated boolean" }, { status: 400 });
  }

  const video = await prisma.video
    .update({
      where: { id },
      data: { validated: body.validated },
      select: {
        id: true,
        provider: true,
        providerId: true,
        status: true,
        views: true,
        validated: true,
        userId: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })
    .catch(() => null);

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const { provider, providerId, status, ...rest } = video;
  const playback = await resolveVideoPlayback({ provider, providerId, status });
  return NextResponse.json({ ...rest, url: playback.url, status: playback.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await prisma.video.findUnique({ where: { id }, select: { userId: true } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const isOwner = video.userId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteVideoRecord(id);
  return new NextResponse(null, { status: 204 });
}
