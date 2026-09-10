import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * @swagger
 * /api/videos/{id}/view:
 *   post:
 *     tags: [Videos]
 *     description: >
 *       Increments a video's view counter. This counter is an engagement indicator
 *       shown for informational purposes only: it is never used to sort or filter
 *       the recruiter catalog (see GET /api/videos).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: New view total.
 *       404:
 *         description: Video not found.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: videoId } = await params;

  try {
    const updated = await prisma.video.update({
      where: { id: videoId },
      data: { views: { increment: 1 } },
      select: { id: true, views: true },
    });

    return NextResponse.json(
      { id: updated.id, views: updated.views },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
