import { prisma } from "@/lib/db";
import { getVideoProvider, type VideoProcessingStatus } from "@/lib/video-provider";

type DbVideoStatus = "PENDING" | "READY" | "FAILED";

function toApiStatus(status: DbVideoStatus): VideoProcessingStatus {
  return status.toLowerCase() as VideoProcessingStatus;
}

/**
 * Resolves what a client should be shown for one video: a playback URL when ready,
 * or an explicit status otherwise. Re-checks live with the provider rather than
 * trusting the DB status blindly, so a provider that goes down mid-flight still
 * degrades to an explicit message instead of a stale "ready".
 */
export async function resolveVideoPlayback(video: {
  provider: string;
  providerId: string;
  status: DbVideoStatus;
}): Promise<{ status: VideoProcessingStatus; url: string | null; message?: string }> {
  if (video.status !== "READY") {
    const liveStatus = await getVideoProvider(video.provider).status(video.providerId);
    return { status: toApiStatus(video.status), url: null, message: liveStatus.message };
  }

  const provider = getVideoProvider(video.provider);
  const url = await provider.playbackUrl(video.providerId);
  if (url) {
    return { status: "ready", url };
  }

  const liveStatus = await provider.status(video.providerId);
  return { status: "failed", url: null, message: liveStatus.message };
}

/**
 * The one place that removes a video: bytes via the owning provider, then the row.
 * Used by the owner-facing DELETE route today, and meant to be reused by the
 * consent-revocation flow so both paths delete the same way instead of duplicating it.
 */
export async function deleteVideoRecord(videoId: string): Promise<boolean> {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, provider: true, providerId: true },
  });
  if (!video) {
    return false;
  }

  const provider = getVideoProvider(video.provider);
  await provider.delete(video.providerId);
  await prisma.video.delete({ where: { id: video.id } });
  return true;
}

/** Deletes every video owned by a user — the primitive a consent-revocation flow needs. */
export async function deleteAllVideosForUser(userId: string): Promise<number> {
  const videos = await prisma.video.findMany({
    where: { userId },
    select: { id: true, provider: true, providerId: true },
  });

  for (const video of videos) {
    const provider = getVideoProvider(video.provider);
    await provider.delete(video.providerId);
  }

  if (videos.length > 0) {
    await prisma.video.deleteMany({ where: { userId } });
  }

  return videos.length;
}
