"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";

export default function BackButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const router = useRouter();

  function goBack() {
    try {
      if (
        document.referrer &&
        new URL(document.referrer).origin === window.location.origin
      ) {
        router.back();
        return;
      }
    } catch {
    }
    router.push(href);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm font-medium text-texte-secondaire transition-colors hover:bg-fond-neutre hover:text-texte-principal"
    >
      <ChevronLeftIcon className="size-4" />
      {label}
    </button>
  );
}
