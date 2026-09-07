import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
