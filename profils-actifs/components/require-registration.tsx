"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RequireRegistration({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("role")) {
      setAllowed(true);
    } else {
      router.replace("/inscription");
    }
  }, [router]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
