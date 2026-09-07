import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ActivitySector } from "@/prisma/prisma/enums";

const VALID_SECTORS = Object.values(ActivitySector);

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