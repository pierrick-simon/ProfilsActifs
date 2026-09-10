import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { decodeCursor, encodeCursor, DecodedCursor } from "@/lib/cursor";

async function requireSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     tags: [Messages]
 *     description: >
 *       Paginated history (composite date+id cursor, most recent first) of the
 *       conversation between the logged-in user and profile {id}.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Id of the other participant in the conversation.
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 30, maximum: 100 }
 *     responses:
 *       200:
 *         description: List of messages, next cursor, and has_more flag.
 *       400:
 *         description: Invalid pagination cursor.
 *       401:
 *         description: No session.
 *       404:
 *         description: Recipient not found.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: otherUserId } = await params;

  const user = await requireSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true },
  });
  if (!otherUser) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);

  const limitParam = searchParams.get("limit");
  let limit = 30;
  if (limitParam !== null) {
    const parsedLimit = parseInt(limitParam, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, 100);
    }
  }

  const cursorParam = searchParams.get("cursor");
  let decodedCursor: DecodedCursor | null = null;
  if (cursorParam !== null && cursorParam !== "") {
    try {
      decodedCursor = decodeCursor(cursorParam);
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message || "Invalid or malformed cursor" },
        { status: 400 },
      );
    }
  }

  const conversationWhere = {
    OR: [
      { senderid: userId, receiverid: otherUserId },
      { senderid: otherUserId, receiverid: userId },
    ],
  };
  const cursorWhere = decodedCursor
    ? {
        OR: [
          { timestamp: { lt: decodedCursor.createdAt } },
          {
            timestamp: decodedCursor.createdAt,
            id: { lt: decodedCursor.id },
          },
        ],
      }
    : {};

  const messages = await prisma.message.findMany({
    where: { AND: [conversationWhere, cursorWhere] },
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = messages.length > limit;
  const returnedMessages = hasMore ? messages.slice(0, limit) : messages;
  const lastMessage =
    returnedMessages.length > 0
      ? returnedMessages[returnedMessages.length - 1]
      : null;

  const nextCursor =
    hasMore && lastMessage && lastMessage.timestamp
      ? encodeCursor({
          created_at: lastMessage.timestamp.toISOString(),
          id: lastMessage.id,
        })
      : null;

  const responseBody = {
    messages: returnedMessages.map((m) => ({
      id: m.id,
      content: m.content,
      sender_id: m.senderid,
      receiver_id: m.receiverid,
      timestamp: m.timestamp ? m.timestamp.toISOString() : null,
      is_mine: m.senderid === userId,
    })),
    next_cursor: nextCursor,
    has_more: hasMore,
  };

  return NextResponse.json(responseBody, { status: 200 });
}

/**
 * @swagger
 * /api/messages/{id}:
 *   post:
 *     tags: [Messages]
 *     description: Sends a text message to profile {id}.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Id of the recipient.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, maxLength: 4000 }
 *     responses:
 *       201:
 *         description: Message sent.
 *       400:
 *         description: Missing or empty content, content too long, or recipient equals sender.
 *       401:
 *         description: No session.
 *       404:
 *         description: Recipient not found.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: receiverId } = await params;

  const user = await requireSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const senderId = user.id;

  if (senderId === receiverId) {
    return NextResponse.json(
      { error: "Cannot message yourself" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content =
    typeof (body as { content?: unknown })?.content === "string"
      ? ((body as { content: string }).content).trim()
      : "";

  if (content.length === 0) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  if (content.length > 4000) {
    return NextResponse.json({ error: "content is too long" }, { status: 400 });
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });
  if (!receiver) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: {
      id: randomUUID(),
      senderid: senderId,
      receiverid: receiverId,
      content,
      timestamp: new Date(),
    },
  });

  return NextResponse.json(
    {
      id: message.id,
      content: message.content,
      sender_id: message.senderid,
      receiver_id: message.receiverid,
      timestamp: message.timestamp ? message.timestamp.toISOString() : null,
      is_mine: true,
    },
    { status: 201 },
  );
}