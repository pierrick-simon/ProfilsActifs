import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * @swagger
 * /api/user/show-profile:
 *   patch:
 *     tags: [Users]
 *     description: >
 *       Toggles whether the logged-in candidate's profile is visible in the
 *       recruiter catalog (GET /api/videos, GET /api/user/{id}). Recruiters have
 *       no catalog profile of their own, so they cannot call this.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [show_profile]
 *             properties:
 *               show_profile: { type: boolean }
 *     responses:
 *       200:
 *         description: Visibility updated.
 *       400:
 *         description: show_profile missing/not a boolean, or caller is a recruiter.
 *       401:
 *         description: No session.
 */
export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "recruiter") {
    return NextResponse.json(
      { error: "Recruiters don't have a catalog profile" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const showProfile = (body as { show_profile?: unknown })?.show_profile;
  if (typeof showProfile !== "boolean") {
    return NextResponse.json(
      { error: "show_profile must be a boolean" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { showProfile },
    select: { id: true, showProfile: true },
  });

  return NextResponse.json(
    { id: updated.id, show_profile: updated.showProfile },
    { status: 200 },
  );
}