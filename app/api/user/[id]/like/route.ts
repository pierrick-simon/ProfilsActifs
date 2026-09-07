import { randomUUID } from "crypto";
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

  if (likerUserId === likedUserId) {
    return NextResponse.json(
      { error: "Cannot like yourself" },
      { status: 400 },
    );
  }

  const likedUser = await prisma.user.findUnique({
    where: { id: likedUserId },
    select: { id: true },
  });
  if (!likedUser) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.like.findUnique({
    where: { likedUserId_likerUserId: { likedUserId, likerUserId } },
  });

  if (!existing) {
    await prisma.like.create({
      data: {
        id: randomUUID(),
        likedUserId,
        likerUserId,
        timestamp: new Date(),
      },
    });
  }

  return NextResponse.json({ liked: true }, { status: 200 });
}

export async function DELETE(
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
