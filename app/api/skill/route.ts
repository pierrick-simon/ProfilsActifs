import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const skills = await prisma.skill.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json(
    {
      skills: skills.map((s) => ({
        id: s.id,
        name: s.name,
        created_at: s.createdAt.toISOString(),
      })),
    },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawName = (body as { name?: unknown })?.name;
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const existing = await prisma.skill.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "A skill with this name already exists" },
      { status: 409 },
    );
  }

  const now = new Date();
  const skill = await prisma.skill.create({
    data: { id: randomUUID(), name, createdAt: now, updatedAt: now },
  });

  return NextResponse.json({ id: skill.id, name: skill.name }, { status: 201 });
}