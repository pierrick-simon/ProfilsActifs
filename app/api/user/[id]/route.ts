import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { resolveVideoPlayback } from "@/lib/videos";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      localisation: true,
      activitySector: true,
      certification: true,
      role: true,
      video: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          provider: true,
          providerId: true,
          status: true,
          views: true,
          validated: true,
        },
      },
    },
  });

  if (!user || user.role === "recruiter") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const city = user.localisation.split(",")[0].trim();

  const spaceIndex = user.name.indexOf(" ");
  const firstName =
    spaceIndex === -1 ? user.name : user.name.slice(0, spaceIndex);
  const lastName = spaceIndex === -1 ? "" : user.name.slice(spaceIndex + 1);

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const [likeCount, likeCountToday, favoryCount, favoryCountToday] =
    await Promise.all([
      prisma.like.count({ where: { likedUserId: userId } }),
      prisma.like.count({
        where: { likedUserId: userId, timestamp: { gte: startOfToday } },
      }),
      prisma.favory.count({ where: { favoredUserId: userId } }),
      prisma.favory.count({
        where: { favoredUserId: userId, timestamp: { gte: startOfToday } },
      }),
    ]);

  const latestVideo = user.video[0] ?? null;

  const playback = latestVideo
    ? await resolveVideoPlayback(latestVideo)
    : null;

  return NextResponse.json(
    {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      city,
      activity: user.activitySector,
      certification_date: user.certification
        ? user.certification.toISOString()
        : null,
      favory: favoryCount,
      favory_today: favoryCountToday,
      video_url: playback?.url ?? null,
      video_status: playback?.status ?? null,
      video_views: latestVideo?.views ?? null,
      video_validated: latestVideo?.validated ?? null,
    },
    { status: 200 },
  );
}