import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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