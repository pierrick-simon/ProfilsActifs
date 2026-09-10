"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth_client";

// Protège les pages réservées aux utilisateurs connectés : sans session
// better-auth valide, on renvoie vers la landing.
export default function RequireRegistration({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/landing");
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return null;
  }

  return <>{children}</>;
}

export function RequireAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const role = session?.user?.role ?? null;

  useEffect(() => {
    if (isPending || !session) {
      return;
    }
    if (role !== "admin") {
      router.replace(
        role === "recruiter" ? "/" : `/profil/${session.user.id}`,
      );
    }
  }, [isPending, session, role, router]);

  if (isPending || !session || role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
