import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: favoredUserId } = await params;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const favoriterUserId = session.user.id;

  if (favoriterUserId === favoredUserId) {
    return NextResponse.json(
      { error: "Cannot favorite yourself" },
      { status: 400 },
    );
  }

  const favoredUser = await prisma.user.findUnique({
    where: { id: favoredUserId },
    select: { id: true },
  });
  if (!favoredUser) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.favory.findUnique({
    where: { favoredUserId_favoriterUserId: { favoredUserId, favoriterUserId } },
  });

  if (!existing) {
    await prisma.favory.create({
      data: {
        id: randomUUID(),
        favoredUserId,
        favoriterUserId,
        timestamp: new Date(),
      },
    });
  }

  return NextResponse.json({ favorited: true }, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: favoredUserId } = await params;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const favoriterUserId = session.user.id;

  await prisma.favory.deleteMany({
    where: { favoredUserId, favoriterUserId },
  });

  return NextResponse.json({ favorited: false }, { status: 200 });
}
