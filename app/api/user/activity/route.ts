import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ActivitySector } from "@/prisma/prisma/enums";

const VALID_SECTORS = Object.values(ActivitySector);

/**
 * @swagger
 * /api/user/activity:
 *   patch:
 *     tags: [Users]
 *     description: Sets the activity sector of the logged-in user's profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activity_sector]
 *             properties:
 *               activity_sector: { type: string }
 *     responses:
 *       200:
 *         description: Activity sector updated.
 *       400:
 *         description: Missing activity_sector or value outside the ActivitySector enum.
 *       401:
 *         description: No session.
 */
export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const activitySector = (body as { activity_sector?: unknown })?.activity_sector;
  if (
    typeof activitySector !== "string" ||
    !VALID_SECTORS.includes(activitySector as ActivitySector)
  ) {
    return NextResponse.json(
      { error: `activity_sector must be one of: ${VALID_SECTORS.join(", ")}` },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { activitySector: activitySector as ActivitySector },
    select: { id: true, activitySector: true },
  });

  return NextResponse.json(
    { id: updated.id, activity_sector: updated.activitySector },
    { status: 200 },
  );
}

/**
 * @swagger
 * /api/user/activity:
 *   delete:
 *     tags: [Users]
 *     description: Clears the activity sector of the logged-in user's profile.
 *     responses:
 *       200:
 *         description: Activity sector cleared.
 *       401:
 *         description: No session.
 */
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { activitySector: null },
    select: { id: true, activitySector: true },
  });

  return NextResponse.json(
    { id: updated.id, activity_sector: updated.activitySector },
    { status: 200 },
  );
}