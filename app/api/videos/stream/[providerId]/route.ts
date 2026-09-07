import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessVideo } from "@/lib/video-access";
import { LocalVideoProvider } from "@/lib/video-provider";

/**
 * Serves local video bytes. Unlike the old /api/media/[type]/[filename] route, this one
 * re-checks the requester's rights on every call — knowing the providerId in the URL is
 * not sufficient by itself, so a leaked link does not grant access on its own.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> },
) {
  const { providerId } = await params;

  const session = await auth.api.getSession({ headers: request.headers });
  const viewerId = session?.user?.id ?? null;
  const viewerRole = session?.user?.role ?? null;

  const video = await prisma.video.findUnique({
    where: { providerId },
    select: {
      provider: true,
      providerId: true,
      userId: true,
      validated: true,
      user: { select: { dateOfBirth: true } },
    },
  });

  // Same 404 whether the video doesn't exist or the viewer just isn't allowed to see it —
  // no confirmation of existence is leaked to an unauthorized caller.
  if (!video || video.provider !== "local") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAccessVideo({ video, viewerId, viewerRole })) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const localProvider = new LocalVideoProvider();
  const file = await localProvider.readBytes(video.providerId);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      // Access-controlled per viewer: must not be cached by shared/proxy caches.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
