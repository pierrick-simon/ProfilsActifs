import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteVideoRecord, resolveVideoPlayback } from "@/lib/videos";

/**
 * @swagger
 * /api/videos/{id}:
 *   patch:
 *     tags: [Videos]
 *     description: >
 *       Admin moderation of a video: toggles its "validated" status. A video that
 *       is not validated never appears in the recruiter catalog (GET /api/videos).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [validated]
 *             properties:
 *               validated: { type: boolean }
 *     responses:
 *       200:
 *         description: Video updated.
 *       400:
 *         description: Missing or invalid "validated" field.
 *       401:
 *         description: No session.
 *       403:
 *         description: Caller is not an admin.
 *       404:
 *         description: Video not found.
 */
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

/**
 * @swagger
 * /api/videos/{id}:
 *   delete:
 *     tags: [Videos]
 *     description: Deletes a video (file and record). Restricted to the owner or an admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Video deleted.
 *       401:
 *         description: No session.
 *       403:
 *         description: Neither owner nor admin.
 *       404:
 *         description: Video not found.
 */
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
