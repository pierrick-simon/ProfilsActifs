"use client";

import { useState } from "react";
import { AlertFillIcon, CloseIcon } from "@/components/icons";


export default function RejectVideoModal({
  videoName,
  onClose,
  onConfirm,
}: {
  videoName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-texte-principal/40 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Refuser la vidéo de ${videoName}`}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-fond-page shadow-[0px_16px_32px_-12px_rgba(14,18,27,0.25)]"
      >
        <div className="flex items-start justify-between border-b border-bordure-defaut px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-erreur/10 text-erreur">
              <AlertFillIcon className="size-5" />
            </span>
            <div className="flex flex-col">
              <h2 className="font-sans text-lg font-semibold text-texte-principal">
                Refus
              </h2>
              <p className="mt-1 font-sans text-sm text-texte-tertiaire">
                Expliquez la raison du refus
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1 text-texte-tertiaire transition-colors hover:bg-fond-neutre hover:text-texte-secondaire"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="p-6">
          <label
            htmlFor="refus-explication"
            className="mb-2 block font-sans text-sm font-medium text-texte-principal"
          >
            Explication <span className="text-erreur">*</span>
          </label>
          <textarea
            id="refus-explication"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explication..."
            className="h-32 w-full resize-none rounded-xl border border-bordure-defaut bg-fond-page px-4 py-3 font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire transition-all focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-bordure-defaut bg-fond-neutre px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 font-sans text-sm font-medium text-texte-secondaire transition-colors hover:bg-bordure-defaut"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trimmed)}
            disabled={!trimmed}
            className="rounded-lg bg-erreur px-4 py-2 font-sans text-sm font-medium text-texte-inverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
