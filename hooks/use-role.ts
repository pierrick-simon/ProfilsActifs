"use client";

import { authClient } from "@/lib/auth_client";

export function useViewerRole() {
  const { data: session, isPending } = authClient.useSession();
  const role = session?.user?.role ?? null;
  const isRecruiter = role === "recruiter";
  const isAdmin = role === "admin";

  return {
    role,
    isRecruiter,
    isAdmin,
    isCandidate: Boolean(session) && !isRecruiter && !isAdmin,
    isPending,
  };
}
