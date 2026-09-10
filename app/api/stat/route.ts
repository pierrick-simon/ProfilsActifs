import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * @swagger
 * /api/stat:
 *   get:
 *     tags: [Admin]
 *     description: >
 *       Aggregate platform statistics for the admin dashboard: active (non-recruiter,
 *       non-banned) profile count, certification rate, and interaction totals
 *       (likes, favorites, messages). Restricted to admins; these numbers are
 *       reporting only and are never used to sort or filter the recruiter catalog.
 *     responses:
 *       200:
 *         description: Aggregate statistics.
 *       401:
 *         description: No session.
 *       403:
 *         description: Caller is not an admin.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const activeProfileWhere = {
    role: { not: "recruiter" },
    OR: [{ banned: false }, { banned: null }],
  };

  const [activeProfiles, certifiedProfiles, likeCount, favoryCount, messageCount] =
    await Promise.all([
      prisma.user.count({ where: activeProfileWhere }),
      prisma.user.count({
        where: { ...activeProfileWhere, certification: { not: null } },
      }),
      prisma.like.count(),
      prisma.favory.count(),
      prisma.message.count(),
    ]);

  const certificationRate =
    activeProfiles > 0 ? certifiedProfiles / activeProfiles : 0;

  return NextResponse.json(
    {
      active_profiles: activeProfiles,
      certification_rate: Math.round(certificationRate * 10000) / 10000,
      interactions: {
        likes: likeCount,
        favorites: favoryCount,
        messages: messageCount,
        total: likeCount + favoryCount + messageCount,
      },
    },
    { status: 200 },
  );
}