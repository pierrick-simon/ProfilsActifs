"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { CheckIcon, ClockIcon, CloseIcon, ShieldCheckIcon, VideoIcon } from "@/components/icons";
import RejectVideoModal from "@/components/reject-video-modal";
import UserTable from "@/components/user-table";
import { useToast } from "@/components/toast";

type ModerationVideo = {
  id: string;
  url: string | null;
  status: "pending" | "ready" | "failed";
  userId: string;
  createdAt: string;
  user: { id: string; name: string; email: string | null };
};

export default function AdminDashboard() {
  const { showError } = useToast();
  const [pending, setPending] = useState<ModerationVideo[] | null>(null);
  // Vidéo dont on est en train de saisir le motif de refus (null = modal fermé).
  const [rejecting, setRejecting] = useState<ModerationVideo | null>(null);
  // Vue active : modération (vidéos à valider) ou tableau des utilisateurs.
  const [view, setView] = useState<"moderation" | "users">("moderation");

  const load = useCallback(async () => {
    const response = await fetch("/api/videos?validated=false&limit=50");
    if (!response.ok) {
      showError("Impossible de charger les vidéos à valider.");
      return;
    }
    const data = await response.json();
    setPending(data.items);
  }, [showError]);

  useEffect(() => {
    let active = true;
    load().then(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, [load]);

  async function setValidated(video: ModerationVideo, validated: boolean) {
    const response = await fetch(`/api/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ validated }),
    });
    if (!response.ok) {
      showError("Action impossible.");
      return;
    }
    setPending((prev) => prev?.filter((v) => v.id !== video.id) ?? null);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col border-x border-bordure-defaut bg-fond-page">
      {/* En-tête */}
      <header className="px-6 py-6 md:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-bleu-institutionnel to-[#5e1016] text-texte-inverse shadow-sm">
              <ShieldCheckIcon className="size-6" />
            </span>
            <div className="flex flex-col">
              <h1 className="font-sans text-xl font-bold leading-tight text-texte-principal">
                Administrateur
              </h1>
              <p className="font-sans text-sm text-texte-tertiaire">
                Espace de modération
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="h-px w-full bg-bordure-defaut" />

      {/* Contenu */}
      <main className="flex flex-1 flex-col bg-fond-neutre/40 p-6 md:p-10">
        {/* Bascule modération / utilisateurs */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-xl border border-bordure-defaut bg-fond-neutre p-1.5 shadow-sm">
            <ViewTab
              label="Modération"
              active={view === "moderation"}
              onClick={() => setView("moderation")}
            />
            <ViewTab
              label="Utilisateurs"
              active={view === "users"}
              onClick={() => setView("users")}
            />
          </div>
        </div>

        {view === "users" ? (
          <UserTable />
        ) : (
          <div className="flex flex-col gap-10">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <h3 className="font-sans text-lg font-bold text-texte-principal">
                  Nouvelles vidéos à valider
                </h3>
                {pending && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-bleu-institutionnel/15 bg-fond-bleu-clair px-2.5 py-0.5 font-sans text-xs font-semibold text-bleu-institutionnel">
                    <VideoIcon className="size-3.5" />
                    {pending.length} en attente
                  </span>
                )}
              </div>

              {pending === null ? (
                <p className="font-sans text-sm text-texte-secondaire">Chargement…</p>
              ) : pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-bordure-forte bg-fond-page p-12 text-center">
                  <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-fond-neutre text-texte-tertiaire">
                    <CheckIcon className="size-7" />
                  </span>
                  <h4 className="mb-1 font-sans text-base font-semibold text-texte-principal">
                    Aucune vidéo en attente
                  </h4>
                  <p className="font-sans text-sm text-texte-tertiaire">
                    Tout est à jour. Beau travail !
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {pending.map((video) => (
                    <PendingCard
                      key={video.id}
                      video={video}
                      onApprove={() => setValidated(video, true)}
                      onReject={() => setRejecting(video)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {rejecting && (
        <RejectVideoModal
          videoName={rejecting.user.name}
          onClose={() => setRejecting(null)}
          onConfirm={() => {
            // Le motif saisi n'est pas persisté : le modèle video n'a pas de champ dédié
            // aujourd'hui. Refuser se contente de confirmer que la vidéo reste non validée
            // et de la retirer de la file d'attente.
            setValidated(rejecting, false);
            setRejecting(null);
          }}
        />
      )}
    </div>
  );
}

function ViewTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-lg bg-fond-page px-6 py-2.5 font-sans text-sm font-semibold text-texte-principal shadow-sm ring-1 ring-black/5 transition-all"
          : "rounded-lg px-6 py-2.5 font-sans text-sm font-semibold text-texte-tertiaire transition-all hover:text-texte-secondaire"
      }
    >
      {label}
    </button>
  );
}

function PendingCard({
  video,
  onApprove,
  onReject,
}: {
  video: ModerationVideo;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-bordure-defaut bg-fond-page shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-texte-principal">
        {video.status === "ready" && video.url ? (
          <video
            src={video.url}
            controls
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-bleu-institutionnel/25 to-texte-principal" />
            <span className="relative font-sans text-xs font-medium text-texte-inverse/80">
              {video.status === "pending"
                ? "Vidéo en cours de traitement"
                : "Vidéo indisponible pour le moment"}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 font-sans text-xs font-medium text-texte-inverse/90">
          <ClockIcon className="size-3.5" />
          {formatRelativeDate(video.createdAt)}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4
          className="mb-1 truncate font-sans text-sm font-semibold text-texte-principal"
          title={video.user.name}
        >
          {video.user.name}
        </h4>
        <p
          className="mb-4 truncate font-sans text-xs text-texte-tertiaire"
          title={video.user.email ?? undefined}
        >
          {video.user.email}
        </p>

        <div className="mt-auto flex gap-2">
          <button
            type="button"
            onClick={onApprove}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-bleu-institutionnel py-2.5 font-sans text-sm font-medium text-texte-inverse shadow-sm transition-colors hover:brightness-110"
          >
            <CheckIcon className="size-4" />
            Approuver
          </button>
          <button
            type="button"
            onClick={onReject}
            aria-label="Rejeter"
            title="Rejeter"
            className="flex size-[42px] shrink-0 items-center justify-center rounded-lg border border-bordure-defaut bg-fond-page text-texte-secondaire transition-colors hover:border-erreur/30 hover:bg-erreur/10 hover:text-erreur"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}
