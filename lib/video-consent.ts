import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { deleteAllVideosForUser } from "@/lib/videos";

export type VideoConsentStatus = {
  granted: boolean;
  grantedAt: Date | null;
  revokedAt: Date | null;
};

const NOT_GRANTED: VideoConsentStatus = { granted: false, grantedAt: null, revokedAt: null };

/** Whether the user has an active, unrevoked RGPD consent to process a video of themselves. */
export async function getVideoConsent(userId: string): Promise<VideoConsentStatus> {
  const consent = await prisma.videoConsent.findUnique({
    where: { userId },
    select: { granted: true, grantedAt: true, revokedAt: true },
  });
  return consent ?? NOT_GRANTED;
}

export async function hasVideoConsent(userId: string): Promise<boolean> {
  const consent = await getVideoConsent(userId);
  return consent.granted;
}

/** Records (or renews) explicit consent. Idempotent: granting again just refreshes the timestamp. */
export async function grantVideoConsent(userId: string): Promise<VideoConsentStatus> {
  const now = new Date();
  const consent = await prisma.videoConsent.upsert({
    where: { userId },
    create: { id: randomUUID(), userId, granted: true, grantedAt: now, revokedAt: null },
    update: { granted: true, grantedAt: now, revokedAt: null },
    select: { granted: true, grantedAt: true, revokedAt: true },
  });
  return consent;
}

/**
 * Withdraws consent. RGPD requires withdrawal to be as easy as granting, and since the
 * videos were processed on the strength of that consent, revoking it removes the legal
 * basis to keep them — so their files and records are erased along with it.
 */
export async function revokeVideoConsent(
  userId: string,
): Promise<{ consent: VideoConsentStatus; deletedVideos: number }> {
  const now = new Date();
  const consent = await prisma.videoConsent.upsert({
    where: { userId },
    create: { id: randomUUID(), userId, granted: false, grantedAt: null, revokedAt: now },
    update: { granted: false, revokedAt: now },
    select: { granted: true, grantedAt: true, revokedAt: true },
  });

  const deletedVideos = await deleteAllVideosForUser(userId);
  return { consent, deletedVideos };
}
