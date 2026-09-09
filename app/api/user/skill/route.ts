import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function GET(request: NextRequest) {
  const user = await requireSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userSkills = await prisma.userSkill.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      skill: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    {
      skills: userSkills.map((us) => ({
        id: us.skill.id,
        name: us.skill.name,
        added_at: us.createdAt.toISOString(),
      })),
    },
    { status: 200 },
  );
}

export async function PATCH(request: NextRequest) {
  const user = await requireSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const skillId = (body as { skill_id?: unknown })?.skill_id;
  if (typeof skillId !== "string" || skillId.length === 0) {
    return NextResponse.json({ error: "skill_id is required" }, { status: 400 });
  }

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existingLink = await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId: user.id, skillId: skill.id } },
  });
  if (!existingLink) {
    await prisma.userSkill.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        skillId: skill.id,
        createdAt: new Date(),
      },
    });
  }

  return NextResponse.json({ id: skill.id, name: skill.name }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const user = await requireSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const skillId = (body as { skill_id?: unknown })?.skill_id;
  if (typeof skillId !== "string" || skillId.length === 0) {
    return NextResponse.json({ error: "skill_id is required" }, { status: 400 });
  }

  await prisma.userSkill.deleteMany({
    where: { userId: user.id, skillId },
  });

  return NextResponse.json({ removed: skillId }, { status: 200 });
}