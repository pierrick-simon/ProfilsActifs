import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "recruiter") {
    return NextResponse.json(
      { error: "Recruiters don't have a catalog profile" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const showProfile = (body as { show_profile?: unknown })?.show_profile;
  if (typeof showProfile !== "boolean") {
    return NextResponse.json(
      { error: "show_profile must be a boolean" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { showProfile },
    select: { id: true, showProfile: true },
  });

  return NextResponse.json(
    { id: updated.id, show_profile: updated.showProfile },
    { status: 200 },
  );
}