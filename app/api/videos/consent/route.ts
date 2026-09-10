import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVideoConsent, grantVideoConsent, revokeVideoConsent } from "@/lib/video-consent";

/**
 * @swagger
 * /api/videos/consent:
 *   get:
 *     tags: [Videos]
 *     description: >
 *       RGPD status of the caller's consent to process (store, encode, serve) a
 *       video of themselves. POST /api/videos and POST /api/videos/from-url both
 *       require this consent to have been granted before accepting a file.
 *     responses:
 *       200:
 *         description: Current consent status.
 *       401:
 *         description: No session.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const consent = await getVideoConsent(session.user.id);
  return NextResponse.json(consent);
}

/**
 * @swagger
 * /api/videos/consent:
 *   post:
 *     tags: [Videos]
 *     description: >
 *       Records the caller's explicit RGPD consent to process a video of
 *       themselves. Must be granted before a video can be uploaded. Idempotent:
 *       calling it again while already granted just refreshes the timestamp.
 *     responses:
 *       200:
 *         description: Consent recorded.
 *       401:
 *         description: No session.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const consent = await grantVideoConsent(session.user.id);
  return NextResponse.json(consent);
}

/**
 * @swagger
 * /api/videos/consent:
 *   delete:
 *     tags: [Videos]
 *     description: >
 *       Withdraws the caller's RGPD consent. Withdrawal must be as easy as
 *       granting, and since it removes the legal basis for keeping videos that
 *       were processed under it, this also deletes all of the caller's videos
 *       (files and records).
 *     responses:
 *       200:
 *         description: Consent withdrawn; returns the updated status and how many videos were deleted.
 *       401:
 *         description: No session.
 */
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { consent, deletedVideos } = await revokeVideoConsent(session.user.id);
  return NextResponse.json({ ...consent, deletedVideos });
}
