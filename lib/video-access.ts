import { isAgeGateBlocked } from "@/lib/age-gate";

type VideoAccessInput = {
  video: {
    userId: string;
    validated: boolean;
    user: { dateOfBirth: Date };
  };
  viewerId: string | null;
  viewerRole: string | null | undefined;
};

/**
 * Single authorization rule for reaching a video's bytes (stream route) or metadata,
 * shared so the two never drift: owner and admins always see it; anyone else needs
 * the video to be moderation-validated and to pass the same age gate the feed applies.
 */
export function canAccessVideo({ video, viewerId, viewerRole }: VideoAccessInput): boolean {
  const isOwner = viewerId !== null && viewerId === video.userId;
  const isAdmin = viewerRole === "admin";
  if (isOwner || isAdmin) {
    return true;
  }

  if (!video.validated) {
    return false;
  }

  const isRecruiter = viewerRole === "recruiter";
  return !isAgeGateBlocked(video.user.dateOfBirth, isRecruiter);
}
