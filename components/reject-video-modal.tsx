"use client";

import { useState } from "react";
import { CloseIcon, SettingsIcon } from "@/components/icons";

// Modal de refus repris de la maquette Figma : en-tête avec icône, zone de
// texte pour justifier le refus, puis boutons Annuler / Confirmer. La raison
// est obligatoire, d'où le bouton désactivé tant que le champ est vide.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-texte-principal/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Refuser la vidéo de ${videoName}`}
        className="relative z-10 flex w-full max-w-[440px] flex-col overflow-hidden rounded-2xl bg-fond-page shadow-[0px_16px_32px_-12px_rgba(14,18,27,0.25)]"
      >
        <div className="flex items-start gap-3.5 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-bordure-defaut text-texte-secondaire">
            <SettingsIcon className="size-5" />
          </span>
          <div className="flex flex-1 flex-col">
            <h2 className="font-sans text-base font-medium text-texte-principal">
              Refus
            </h2>
            <p className="font-sans text-sm text-texte-tertiaire">
              Expliquez la raison du refus
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 rounded-lg p-1 text-texte-tertiaire transition-colors hover:bg-fond-neutre hover:text-texte-secondaire"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="h-px w-full bg-bordure-defaut" />

        <div className="flex flex-col gap-1.5 p-5">
          <label
            htmlFor="refus-explication"
            className="font-sans text-sm font-medium text-texte-principal"
          >
            Explication <span className="text-bleu-institutionnel">*</span>
          </label>
          <textarea
            id="refus-explication"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explication..."
            rows={4}
            className="w-full resize-none rounded-[10px] border border-bordure-defaut bg-fond-page px-3 py-2.5 font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] transition-colors focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
          />
        </div>

        <div className="h-px w-full bg-bordure-defaut" />

        <div className="flex items-center gap-3 p-5">
          <button
            type="button"
            onClick={onClose}
            className="flex flex-1 items-center justify-center rounded-[10px] border border-bordure-defaut bg-fond-page px-4 py-2.5 font-sans text-sm font-medium text-texte-secondaire shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] transition-colors hover:bg-fond-neutre"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trimmed)}
            disabled={!trimmed}
            className="flex flex-1 items-center justify-center overflow-hidden rounded-[10px] bg-bleu-institutionnel bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%)] px-4 py-2.5 shadow-[0px_0px_0px_1px_var(--color-bleu-institutionnel),0px_1px_2px_0px_rgba(14,18,27,0.24)] outline outline-1 -outline-offset-1 outline-white/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
          >
            <span className="font-sans text-sm font-medium text-texte-inverse">
              Confirmer
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
