import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * @swagger
 * /api/skill/{id}:
 *   delete:
 *     tags: [Skills]
 *     description: >
 *       Deletes a skill from the reference table (and, in cascade, its association
 *       with every profile that had it). Restricted to admins.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Skill deleted.
 *       401:
 *         description: No session.
 *       403:
 *         description: Caller is not an admin.
 *       404:
 *         description: Skill not found.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: skillId } = await params;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.skill.delete({ where: { id: skillId } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true }, { status: 200 });
}