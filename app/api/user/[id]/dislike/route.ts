import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: likedUserId } = await params;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const likerUserId = session.user.id;

  await prisma.like.deleteMany({
    where: { likedUserId, likerUserId },
  });

  return NextResponse.json({ liked: false }, { status: 200 });
}