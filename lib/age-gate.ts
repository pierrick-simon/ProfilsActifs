export function getMinorAgeCutoffs(now: Date = new Date()) {
  const cutoff16 = new Date(now);
  cutoff16.setFullYear(now.getFullYear() - 16);

  const cutoff18 = new Date(now);
  cutoff18.setFullYear(now.getFullYear() - 18);

  return { cutoff16, cutoff18 };
}

/**
 * Generates the Prisma WHERE filter for age-gated video visibility.
 * If requester is a recruiter, no age filter is applied.
 * Otherwise, videos owned by users aged 16 to 17 (inclusive) are excluded (18+ and <16 visible to everyone).
 */
export function getAgeGatedWhereClause(isRecruiter: boolean, now: Date = new Date()) {
  if (isRecruiter) {
    return {};
  }

  const { cutoff16, cutoff18 } = getMinorAgeCutoffs(now);

  return {
    NOT: {
      AND: [
        { user: { dateOfBirth: { gt: cutoff18 } } },
        { user: { dateOfBirth: { lte: cutoff16 } } },
      ],
    },
  };
}

/**
 * Single-row equivalent of `getAgeGatedWhereClause`, for endpoints that already
 * loaded one video/profile and need a boolean instead of a Prisma filter.
 */
export function isAgeGateBlocked(
  dateOfBirth: Date,
  isRecruiter: boolean,
  now: Date = new Date(),
): boolean {
  if (isRecruiter) {
    return false;
  }

  const { cutoff16, cutoff18 } = getMinorAgeCutoffs(now);
  return dateOfBirth > cutoff18 && dateOfBirth <= cutoff16;
}
