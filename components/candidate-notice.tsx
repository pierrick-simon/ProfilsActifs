"use client";

import { usePathname } from "next/navigation";
import { useViewerRole } from "@/hooks/use-role";

export default function CandidateNotice() {
  const pathname = usePathname();
  const { isCandidate, isPending } = useViewerRole();
  const onAuthPage =
    pathname.startsWith("/inscription") || pathname.startsWith("/connexion");

  if (!onAuthPage && (isPending || !isCandidate)) {
    return null;
  }

  return (
    <div className="border-b border-bordure-defaut bg-fond-bleu-clair px-4 py-3 text-center">
      <p className="font-sans text-xs text-bleu-institutionnel">
        Aucune donnée de ce service n&apos;est utilisée pour déterminer vos droits ni le montant de vos allocations
      </p>
    </div>
  );
}
