import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * @swagger
 * /api/user:
 *   delete:
 *     tags: [Users]
 *     description: >
 *       Permanently deletes the logged-in user's account, along with its sessions
 *       and linked auth accounts, in a single transaction. Requires an explicit
 *       confirm flag to guard against accidental calls.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirm]
 *             properties:
 *               confirm: { type: boolean, enum: [true] }
 *     responses:
 *       200:
 *         description: Account deleted.
 *       400:
 *         description: confirm was not sent as true.
 *       401:
 *         description: No session.
 */
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
  }

  if ((body as { confirm?: unknown })?.confirm !== true) {
    return NextResponse.json(
      { error: "Send { confirm: true } to permanently delete this account" },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return NextResponse.json({ deleted: true }, { status: 200 });
}