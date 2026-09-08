import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { resolveVideoPlayback } from "@/lib/videos";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favory.findMany({
    where: { favoriterUserId: session.user.id },
    orderBy: { timestamp: "desc" },
    select: {
      favoredUserId: true,
      user_favory_favoredUserIdTouser: {
        select: {
          id: true,
          name: true,
          localisation: true,
          activitySector: true,
          video: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              provider: true,
              providerId: true,
              status: true,
              views: true,
            },
          },
        },
      },
    },
  });

  const items = await Promise.all(
    favorites.map(async (favorite) => {
      const user = favorite.user_favory_favoredUserIdTouser;
      const latestVideo = user.video[0] ?? null;
      const playback = latestVideo
        ? await resolveVideoPlayback(latestVideo)
        : null;
      const city = user.localisation
        ? user.localisation.split(",")[0].trim()
        : "";

      return {
        id: latestVideo?.id ?? user.id,
        userId: user.id,
        name: user.name,
        location: city || null,
        role: user.activitySector,
        url: playback?.url ?? null,
        views: latestVideo?.views ?? 0,
      };
    }),
  );

  return NextResponse.json({ items }, { status: 200 });
}
