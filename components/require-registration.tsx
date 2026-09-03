"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/use-role";

export default function RequireRegistration({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const role = useRole();

  useEffect(() => {
    if (!role) {
      router.replace("/inscription");
    }
  }, [role, router]);

  if (!role) {
    return null;
  }

  return <>{children}</>;
}
