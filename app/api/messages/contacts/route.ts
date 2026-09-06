import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderid: userId }, { receiverid: userId }],
    },
    select: { senderid: true, receiverid: true, timestamp: true },
    orderBy: { timestamp: "desc" },
  });

  const lastContactAt = new Map<string, Date | null>();
  for (const m of messages) {
    const otherId = m.senderid === userId ? m.receiverid : m.senderid;
    if (!otherId || otherId === userId) continue;
    if (!lastContactAt.has(otherId)) {
      lastContactAt.set(otherId, m.timestamp);
    }
  }

  const contactIds = Array.from(lastContactAt.keys());
  if (contactIds.length === 0) {
    return NextResponse.json({ contacts: [] }, { status: 200 });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: contactIds } },
    select: { id: true, name: true, image: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  const contacts = contactIds
    .map((id) => {
      const u = userById.get(id);
      if (!u) return null;
      const lastAt = lastContactAt.get(id) ?? null;
      return {
        id: u.id,
        name: u.name,
        image: u.image,
        last_message_at: lastAt ? lastAt.toISOString() : null,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return NextResponse.json({ contacts }, { status: 200 });
}