"use client";

import { useViewerRole } from "@/hooks/use-role";

export default function CandidateNotice() {
  const { isCandidate, isPending } = useViewerRole();

  if (isPending || !isCandidate) {
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
