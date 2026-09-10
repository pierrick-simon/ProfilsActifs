import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import { auth } from "@/lib/auth";
import {
  CATALOG_ORDER_BY,
  catalogCursorWhere,
  decodeCatalogCursor,
  nextCatalogCursor,
  parseCatalogFilters,
} from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { ALLOWED_VIDEO_MIME_TYPES, extensionForMimeType, MAX_VIDEO_SIZE_BYTES } from "@/lib/storage";
import { getActiveVideoProvider } from "@/lib/video-provider";
import { resolveVideoPlayback } from "@/lib/videos";

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
  const limit = Math.min(Number(searchParams.get("limit") ?? 20) || 20, 50);

  const sortBy = searchParams.get("sortBy") ?? "date";
  if (sortBy !== "date") {
    return NextResponse.json({ error: "Critère de tri non pris en charge" }, { status: 400 });
  }

  const cursorParam = searchParams.get("cursor");
  const cursor = cursorParam ? decodeCatalogCursor(cursorParam) : null;
  if (cursorParam && !cursor) {
    return NextResponse.json({ error: "Curseur de pagination invalide" }, { status: 400 });
  }

  const filters = parseCatalogFilters(searchParams);
  if (!filters.ok) {
    return NextResponse.json({ error: filters.error }, { status: 400 });
  }

  const showProfileWhere = isOwnVideos || isAdmin ? {} : { showProfile: true };

  const userWhere = {
    ...((filters.where as { user?: Record<string, unknown> }).user ?? {}),
    ...showProfileWhere,
  };

  const videos = await prisma.video.findMany({
    where: {
      ...(requestedUserId ? { userId: requestedUserId } : {}),
      ...(isOwnVideos || isAdmin
        ? validatedParam !== null
          ? { validated: validatedParam === "true" }
          : {}
        : { validated: true }),
      ...filters.where,
      ...(Object.keys(userWhere).length > 0 ? { user: userWhere } : {}),
      ...catalogCursorWhere(cursor),
    },
    orderBy: CATALOG_ORDER_BY,
    take: limit + 1,
    select: {
      id: true,
      provider: true,
      providerId: true,
      status: true,
      views: true,
      validated: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          activitySector: true,
          localisation: true,
          updatedAt: true,
          certification: true,
        },
      },
    },
  });

  const hasMore = videos.length > limit;
  const items = hasMore ? videos.slice(0, limit) : videos;

  const resolvedItems = await Promise.all(
    items.map(async ({ provider, providerId, status, ...rest }) => {
      const playback = await resolveVideoPlayback({ provider, providerId, status });
      return { ...rest, url: playback.url, status: playback.status };
    }),
  );

  return NextResponse.json({
    items: resolvedItems,
    nextCursor: hasMore ? nextCatalogCursor(items[items.length - 1]) : null,
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

  if (!extensionForMimeType(file.type) || !ALLOWED_VIDEO_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Type de vidéo non pris en charge" }, { status: 415 });
  }

  const headerChunk = Buffer.from(await file.slice(0, 4100).arrayBuffer());
  const detected = await fileTypeFromBuffer(headerChunk);

  if (!detected || !ALLOWED_VIDEO_MIME_TYPES.includes(detected.mime)) {
    return NextResponse.json(
      { error: "Le contenu du fichier ne correspond à aucun type de vidéo autorisé" },
      { status: 415 },
    );
  }

  if (!extensionForMimeType(detected.mime)) {
    return NextResponse.json({ error: "Type de vidéo non pris en charge" }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const provider = getActiveVideoProvider();
  const providerId = await provider.store({ bytes, mimeType: detected.mime });
  const initialStatus = await provider.status(providerId);

  const video = await prisma.video.create({
    data: {
      id: randomUUID(),
      provider: provider.name,
      providerId,
      status: initialStatus.status.toUpperCase() as "PENDING" | "READY" | "FAILED",
      userId: session.user.id,
      views: 0,
      validated: false,
    },
  });

  const playback = await resolveVideoPlayback(video);
  return NextResponse.json(
    { ...video, url: playback.url, status: playback.status },
    { status: 201 },
  );
}
