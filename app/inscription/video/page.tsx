"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, CloseIcon, InfoIcon, LinkIcon, PlusIcon } from "@/components/icons";
import { useToast } from "@/components/toast";

const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 Mo, aligné sur l'API.

export default function VideoUploadPage() {
  const router = useRouter();
  const { showError } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [grantingConsent, setGrantingConsent] = useState(false);

  const previewUrl = videoUrl ?? (link.trim() || null);

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      showError("La vidéo ne doit pas dépasser 100 Mo.", "Fichier trop volumineux");
      return;
    }
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
  }

  async function uploadVideo() {
    const trimmedLink = link.trim();
    let response: Response | null = null;

    setSubmitting(true);
    if (videoFile) {
      const formData = new FormData();
      formData.append("file", videoFile);
      response = await fetch("/api/videos", {
        method: "POST",
        body: formData,
      });
    } else if (trimmedLink) {
      response = await fetch("/api/videos/from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedLink }),
      });
    }
    setSubmitting(false);

    if (response && !response.ok) {
      const data = await response.json().catch(() => null);
      showError(
        data?.error ?? "L'envoi de la vidéo a échoué.",
        "Vidéo non envoyée",
      );
      return;
    }

    router.push("/");
  }

  async function handleContinue() {
    if (submitting) {
      return;
    }

    if (!videoFile && !link.trim()) {
      router.push("/");
      return;
    }

    setSubmitting(true);
    const consentRes = await fetch("/api/videos/consent").catch(() => null);
    const consent = consentRes?.ok ? await consentRes.json().catch(() => null) : null;
    setSubmitting(false);

    if (consent?.granted) {
      await uploadVideo();
      return;
    }

    setConsentModalOpen(true);
  }

  async function handleAcceptConsent() {
    if (grantingConsent) {
      return;
    }

    setGrantingConsent(true);
    const res = await fetch("/api/videos/consent", { method: "POST" }).catch(() => null);
    setGrantingConsent(false);

    if (!res?.ok) {
      showError("Impossible d'enregistrer votre consentement.", "Consentement RGPD");
      return;
    }

    setConsentModalOpen(false);
    await uploadVideo();
  }

  return (
    <main className="flex flex-1 flex-col bg-fond-page">
      <header className="flex items-center gap-6 border-b border-bordure-defaut px-11 py-6">
        <div className="flex flex-1 items-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-bleu-institutionnel font-sans text-sm font-medium text-texte-inverse">
            PA
          </span>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <Link
            href="/"
            aria-label="Fermer"
            className="rounded-[10px] p-2.5 text-texte-tertiaire transition-colors hover:bg-fond-neutre hover:text-texte-secondaire"
          >
            <CloseIcon className="size-5" />
          </Link>
        </div>
      </header>

      <div className="px-11 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-0.5 rounded-lg border border-bordure-defaut bg-fond-page py-1.5 pl-1.5 pr-2.5 font-sans text-sm font-medium text-texte-secondaire shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] transition-colors hover:bg-fond-neutre"
        >
          <ChevronLeftIcon className="size-5" />
          Passer cette étape
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 justify-center px-6 py-6">
        <div className="flex h-full w-full max-w-[384px] flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="font-sans text-base font-medium text-texte-principal">
              Aperçu de la vidéo
            </h1>
            <p className="font-sans text-sm text-texte-tertiaire">
              Voici comment votre vidéo apparaîtra.
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 rounded-3xl border border-bordure-defaut bg-fond-page p-6 shadow-[0_12px_24px_-12px_rgba(51,51,51,0.12)]">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-bordure-forte bg-fond-page p-3 transition-colors hover:bg-fond-neutre"
            >
              {previewUrl ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-full w-full rounded-lg object-contain"
                />
              ) : (
                <>
                  <span className="flex items-center justify-center rounded-full bg-fond-neutre p-2.5 text-texte-secondaire">
                    <PlusIcon className="size-5" />
                  </span>
                  <span className="font-sans text-sm font-medium text-texte-tertiaire">
                    Importer une vidéo
                  </span>
                </>
              )}
            </button>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="lien-video"
                className="font-sans text-sm font-medium text-texte-principal"
              >
                Ou coller un lien
              </label>
              <div className="flex items-center gap-2 rounded-[10px] border border-bordure-defaut bg-fond-page px-3 py-2.5 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus-within:border-bleu-institutionnel focus-within:ring-2 focus-within:ring-fond-bleu-clair">
                <LinkIcon className="size-4 shrink-0 text-texte-tertiaire" />
                <input
                  id="lien-video"
                  type="url"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="https://exemple.fr/ma-video.mp4"
                  className="flex-1 bg-transparent font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:outline-none"
                />
              </div>
            </div>

            <div className="h-px w-full border-t border-dashed border-bordure-defaut" />

            <button
              type="button"
              onClick={handleContinue}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-1 overflow-hidden rounded-[10px] bg-bleu-institutionnel bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%)] p-2.5 shadow-[0px_0px_0px_1px_var(--color-bleu-institutionnel),0px_1px_2px_0px_rgba(14,18,27,0.24)] outline outline-1 -outline-offset-1 outline-white/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
            >
              <span className="px-1 font-sans text-sm font-medium leading-5 text-texte-inverse">
                {submitting ? "Envoi..." : "Continuer"}
              </span>
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={handleSelect}
            className="hidden"
          />
        </div>
      </div>

      {consentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setConsentModalOpen(false)}
            className="absolute inset-0 cursor-default bg-texte-principal/40 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-consent-title"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-fond-page shadow-[0px_16px_32px_-12px_rgba(14,18,27,0.25)]"
          >
            <div className="flex items-start justify-between border-b border-bordure-defaut px-6 py-5">
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fond-bleu-clair text-bleu-institutionnel">
                  <InfoIcon className="size-5" />
                </span>
                <div className="flex flex-col">
                  <h2
                    id="video-consent-title"
                    className="font-sans text-lg font-semibold text-texte-principal"
                  >
                    Consentement RGPD
                  </h2>
                  <p className="mt-1 font-sans text-sm text-texte-tertiaire">
                    Avant d&apos;envoyer votre vidéo, nous avons besoin de votre accord
                    explicite pour la stocker, l&apos;encoder et la diffuser aux
                    recruteurs. Vous pourrez retirer ce consentement à tout moment
                    depuis votre profil ; votre vidéo sera alors définitivement
                    supprimée.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConsentModalOpen(false)}
                aria-label="Fermer"
                className="rounded-lg p-1 text-texte-tertiaire transition-colors hover:bg-fond-neutre hover:text-texte-secondaire"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <div className="flex justify-end gap-3 border-t border-bordure-defaut bg-fond-neutre px-6 py-4">
              <button
                type="button"
                onClick={() => setConsentModalOpen(false)}
                className="rounded-lg px-4 py-2 font-sans text-sm font-medium text-texte-secondaire transition-colors hover:bg-bordure-defaut"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAcceptConsent}
                disabled={grantingConsent}
                className="rounded-lg bg-bleu-institutionnel px-4 py-2 font-sans text-sm font-medium text-texte-inverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {grantingConsent ? "Envoi..." : "J'accepte et j'envoie ma vidéo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
