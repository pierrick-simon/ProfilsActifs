import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveVideoPlayback } from "@/lib/videos";

// Convertit une réponse de formulaire (Json libre) en texte lisible.
function responseToText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(responseToText).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("value" in record) {
      return responseToText(record.value);
    }
    return Object.values(record).map(responseToText).filter(Boolean).join(", ");
  }
  return String(value);
}

function ageFromBirthDate(birth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      activitySector: true,
      localisation: true,
      dateOfBirth: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const videoRow = await prisma.video.findFirst({
    where: { userId: id, validated: true },
    orderBy: { createdAt: "desc" },
    select: {
      provider: true,
      providerId: true,
      status: true,
      views: true,
      createdAt: true,
    },
  });

  let video: { url: string | null; views: number; createdAt: Date } | null = null;
  if (videoRow) {
    const playback = await resolveVideoPlayback({
      provider: videoRow.provider,
      providerId: videoRow.providerId,
      status: videoRow.status,
    });
    video = {
      url: playback.url,
      views: videoRow.views,
      createdAt: videoRow.createdAt,
    };
  }

  const skillRows = await prisma.userSkill.findMany({
    where: { userId: id },
    select: { skill: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  const skills = skillRows.map((row) => row.skill.name);

  const responseRows = await prisma.formResponse.findMany({
    where: { userId: id, archived: false },
    orderBy: { question: { order: "asc" } },
    select: { response: true, question: { select: { name: true } } },
  });
  const responses = responseRows
    .map((row) => ({
      question: row.question.name,
      answer: responseToText(row.response),
    }))
    .filter((row) => row.answer.length > 0);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      image: user.image,
      role: user.activitySector,
      location: user.localisation,
      age: ageFromBirthDate(new Date(user.dateOfBirth)),
    },
    video,
    skills,
    responses,
  });
}
