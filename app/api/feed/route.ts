import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { decodeCursor, encodeCursor, DecodedCursor } from "@/lib/cursor";
import { getAgeGatedWhereClause } from "@/lib/age-gate";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 1. Parse and clamp limit
  const limitParam = searchParams.get("limit");
  let limit = 20;
  if (limitParam !== null) {
    const parsedLimit = parseInt(limitParam, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, 50);
    }
  }

  // 2. Parse and decode cursor
  const cursorParam = searchParams.get("cursor");
  let decodedCursor: DecodedCursor | null = null;
  if (cursorParam !== null && cursorParam !== "") {
    try {
      decodedCursor = decodeCursor(cursorParam);
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message || "Invalid or malformed cursor" },
        { status: 400 }
      );
    }
  }

  // 3. Authenticate and retrieve user role
  let isRecruiter = false;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (session?.user?.role === "recruiter") {
      isRecruiter = true;
    }
  } catch {
    // Unauthenticated or session lookup failure defaults to non-recruiter
    isRecruiter = false;
  }

  // 4. Build query filters
  const ageWhere = getAgeGatedWhereClause(isRecruiter);
  const cursorWhere = decodedCursor
    ? {
        OR: [
          { createdAt: { lt: decodedCursor.createdAt } },
          {
            createdAt: decodedCursor.createdAt,
            id: { lt: decodedCursor.id },
          },
        ],
      }
    : {};

  // 5. Query videos with limit + 1 to detect has_more
  const videos = await prisma.video.findMany({
    where: {
      AND: [{ validated: true }, ageWhere, cursorWhere],
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: limit + 1,
  });

  const hasMore = videos.length > limit;
  const returnedVideos = hasMore ? videos.slice(0, limit) : videos;
  const lastVideo = returnedVideos.length > 0 ? returnedVideos[returnedVideos.length - 1] : null;

  const nextCursor =
    hasMore && lastVideo
      ? encodeCursor({
          created_at: lastVideo.createdAt.toISOString(),
          id: lastVideo.id,
        })
      : null;

  const responseBody = {
    videos: returnedVideos.map((v) => ({
      id: v.id,
      created_at: v.createdAt.toISOString(),
      video_url: v.url,
      thumbnail_url: "",
      caption: "",
      user_id: v.userId,
      like_count: 0,
      comment_count: 0,
    })),
    next_cursor: nextCursor,
    has_more: hasMore,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
