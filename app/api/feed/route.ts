import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { decodeCursor, encodeCursor, DecodedCursor } from "@/lib/cursor";
import { getAgeGatedWhereClause } from "@/lib/age-gate";
import { resolveVideoPlayback } from "@/lib/videos";

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

  // 3. Authenticate and retrieve user role + id
  let isRecruiter = false;
  let viewerId: string | null = null;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (session?.user?.role === "recruiter") {
      isRecruiter = true;
    }
    viewerId = session?.user?.id ?? null;
  } catch {
    // Unauthenticated or session lookup failure defaults to non-recruiter
    isRecruiter = false;
    viewerId = null;
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

  // 6. Check which of the returned videos' profiles the viewer already likes
  let likedProfileIds = new Set<string>();
  if (viewerId) {
    const profileIds = Array.from(new Set(returnedVideos.map((v) => v.userId)));
    if (profileIds.length > 0) {
      const likes = await prisma.like.findMany({
        where: {
          likerUserId: viewerId,
          likedUserId: { in: profileIds },
        },
        select: { likedUserId: true },
      });
      likedProfileIds = new Set(likes.map((l) => l.likedUserId));
    }
  }

  // 7. Check which of the returned videos' profiles the viewer already put in his favory
  let favoredProfileIds = new Set<string>();
  if (viewerId) {
    const profileIds = Array.from(new Set(returnedVideos.map((v) => v.userId)));
    if (profileIds.length > 0) {
      const favorites = await prisma.favory.findMany({
        where: {
          favoriterUserId: viewerId,
          favoredUserId: { in: profileIds },
        },
        select: { favoredUserId: true },
      });
      favoredProfileIds = new Set(favorites.map((l) => l.favoredUserId));
    }
  }

  const resolvedVideos = await Promise.all(
    returnedVideos.map(async (v) => {
      const playback = await resolveVideoPlayback(v);
      return {
        id: v.id,
        created_at: v.createdAt.toISOString(),
        video_url: playback.url,
        video_status: playback.status,
        user_id: v.userId,
        is_profile_liked: likedProfileIds.has(v.userId),
        is_profile_favored: favoredProfileIds.has(v.userId),
      };
    }),
  );

  const responseBody = {
    videos: resolvedVideos,
    next_cursor: nextCursor,
    has_more: hasMore,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
