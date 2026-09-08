export function getMinorAgeCutoffs(now: Date = new Date()) {
  const cutoff16 = new Date(now);
  cutoff16.setFullYear(now.getFullYear() - 16);

  const cutoff18 = new Date(now);
  cutoff18.setFullYear(now.getFullYear() - 18);

  return { cutoff16, cutoff18 };
}

export function isAtLeast16(
  dateOfBirth: Date | string,
  now: Date = new Date(),
): boolean {
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) {
    return false;
  }
  const { cutoff16 } = getMinorAgeCutoffs(now);
  return birth <= cutoff16;
}

export function maxBirthDateInput(now: Date = new Date()): string {
  const { cutoff16 } = getMinorAgeCutoffs(now);
  const year = cutoff16.getFullYear();
  const month = String(cutoff16.getMonth() + 1).padStart(2, "0");
  const day = String(cutoff16.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


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
