import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * @swagger
 * /api/user/export:
 *   get:
 *     tags: [Users]
 *     description: >
 *       GDPR/RGPD data export: returns every piece of data the platform holds
 *       about the logged-in user (profile, sessions, linked auth accounts,
 *       videos, skills, likes, favorites, messages and form answers) as a
 *       single downloadable JSON document. Sensitive secrets (passwords,
 *       OAuth tokens, session tokens) are never included in the export.
 *     responses:
 *       200:
 *         description: JSON export of the user's personal data.
 *       401:
 *         description: No session.
 *       404:
 *         description: User not found.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      acceptedTerms: true,
      showProfile: true,
      localisation: true,
      dateOfBirth: true,
      certification: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      activitySector: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [
    accounts,
    sessions,
    videos,
    userSkills,
    formResponses,
    favoritesGiven,
    favoritesReceived,
    likesGiven,
    likesReceived,
    messagesSent,
    messagesReceived,
  ] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        issuer: true,
        providerId: true,
        accountId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
      },
    }),
    prisma.video.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        providerId: true,
        status: true,
        views: true,
        validated: true,
        createdAt: true,
      },
    }),
    prisma.userSkill.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        skill: { select: { id: true, name: true } },
      },
    }),
    prisma.formResponse.findMany({
      where: { userId },
      select: {
        id: true,
        questionId: true,
        response: true,
        formVersionId: true,
        createdAt: true,
      },
    }),
    prisma.favory.findMany({
      where: { favoriterUserId: userId },
      select: { id: true, favoredUserId: true, timestamp: true },
    }),
    prisma.favory.findMany({
      where: { favoredUserId: userId },
      select: { id: true, favoriterUserId: true, timestamp: true },
    }),
    prisma.like.findMany({
      where: { likerUserId: userId },
      select: { id: true, likedUserId: true, timestamp: true },
    }),
    prisma.like.findMany({
      where: { likedUserId: userId },
      select: { id: true, likerUserId: true, timestamp: true },
    }),
    prisma.message.findMany({
      where: { senderid: userId },
      select: { id: true, receiverid: true, content: true, timestamp: true },
    }),
    prisma.message.findMany({
      where: { receiverid: userId },
      select: { id: true, senderid: true, content: true, timestamp: true },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: user,
    accounts,
    sessions,
    videos,
    skills: userSkills.map((us) => ({
      id: us.id,
      createdAt: us.createdAt,
      skill: us.skill,
    })),
    formResponses,
    favorites: {
      given: favoritesGiven,
      received: favoritesReceived,
    },
    likes: {
      given: likesGiven,
      received: likesReceived,
    },
    messages: {
      sent: messagesSent,
      received: messagesReceived,
    },
  };

  return NextResponse.json(exportData, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="user-data-export-${userId}.json"`,
    },
  });
}
