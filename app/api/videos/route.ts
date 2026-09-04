import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  extensionForMimeType,
  MAX_VIDEO_SIZE_BYTES,
  saveUploadedFile,
} from "@/lib/storage";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get("userId");
  const isOwnVideos = requestedUserId === session.user.id;
  const isAdmin = session.user.role === "admin";
  const validatedParam = searchParams.get("validated");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20) || 20, 50);

  const videos = await prisma.video.findMany({
    where: {
      ...(requestedUserId ? { userId: requestedUserId } : {}),
      ...(isOwnVideos || isAdmin
        ? validatedParam !== null
          ? { validated: validatedParam === "true" }
          : {}
        : { validated: true }),
    },
    orderBy: { id: "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      url: true,
      views: true,
      validated: true,
      userId: true,
      user: { select: { id: true, name: true, image: true } },
    },
  });

  const hasMore = videos.length > limit;
  const items = hasMore ? videos.slice(0, limit) : videos;

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_VIDEO_SIZE_BYTES) {
    return NextResponse.json(
        { error: "La vidéo dépasse la limite de taille de 100 Mo" },
        { status: 413 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return NextResponse.json(
        { error: "La vidéo dépasse la limite de taille de 100 Mo" },
        { status: 413 },
    );
  }

  // Rejet rapide des types déclarés manifestement invalides (contrôle peu coûteux, mais pas suffisant à lui seul)
  if (!extensionForMimeType(file.type) || !ALLOWED_VIDEO_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Type de vidéo non pris en charge" }, { status: 415 });
  }

  // Ne lire que les premiers octets pour détecter la signature du fichier (évite de charger tout le fichier en mémoire)
  const headerChunk = Buffer.from(await file.slice(0, 4100).arrayBuffer());
  const detected = await fileTypeFromBuffer(headerChunk);

  if (!detected || !ALLOWED_VIDEO_MIME_TYPES.includes(detected.mime)) {
    return NextResponse.json(
        { error: "Le contenu du fichier ne correspond à aucun type de vidéo autorisé" },
        { status: 415 },
    );
  }

  const detectedExtension = extensionForMimeType(detected.mime);
  if (!detectedExtension) {
    return NextResponse.json({ error: "Type de vidéo non pris en charge" }, { status: 415 });
  }

  // On repasse le fichier original par référence, sans le recharger entièrement en mémoire
  const validatedFile = new File([file], file.name, { type: detected.mime });
  const { url } = await saveUploadedFile(validatedFile, "videos");

  const video = await prisma.video.create({
    data: {
      id: randomUUID(),
      url,
      userId: session.user.id,
      views: 0,
      validated: false,
    },
  });

  return NextResponse.json(video, { status: 201 });
}