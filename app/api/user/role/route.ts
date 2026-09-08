import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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

  const requestedRole = (body as { role?: unknown })?.role;
  if (requestedRole !== "recruiter") {
    return NextResponse.json(
      { error: "role must be recruiter" },
      { status: 400 },
    );
  }

  const currentRole = session.user.role ?? null;
  if (currentRole === "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (currentRole === "recruiter") {
    return NextResponse.json({ error: "Role already set" }, { status: 409 });
  }
  if (currentRole !== "user" && currentRole !== null) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { role: "recruiter" },
    select: { id: true, role: true },
  });

  return NextResponse.json(
    { id: updated.id, role: updated.role },
    { status: 200 },
  );
}
