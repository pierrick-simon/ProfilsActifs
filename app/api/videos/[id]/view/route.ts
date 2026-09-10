import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * @swagger
 * /api/videos/{id}/view:
 *   post:
 *     tags: [Videos]
 *     description: >
 *       Increments a video's view counter when a visitor other than the
 *       publisher watches it. The owner's own plays are ignored. This counter
 *       is informational only: it is never used to sort or filter the recruiter
 *       catalog (see GET /api/videos).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Current view total.
 *       401:
 *         description: No session.
 *       404:
 *         description: Video not found.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: videoId } = await params;
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, views: true, userId: true },
  });

  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (video.userId === session.user.id) {
    return NextResponse.json(
      { id: video.id, views: video.views },
      { status: 200 },
    );
  }

  const updated = await prisma.video.update({
    where: { id: videoId },
    data: { views: { increment: 1 } },
    select: { id: true, views: true },
  });

  return NextResponse.json(
    { id: updated.id, views: updated.views },
    { status: 200 },
  );
}
