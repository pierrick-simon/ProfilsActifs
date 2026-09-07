"use client";

import { useState } from "react";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  CloseIcon,
  PlayIcon,
  ShieldCheckIcon,
  UserIcon,
  VideoIcon,
} from "@/components/icons";
import RejectVideoModal from "@/components/reject-video-modal";
import UserTable from "@/components/user-table";

// Fausses données de démonstration : la page n'est pour l'instant qu'une
// maquette (aucun appel API). Les compteurs et vidéos seront branchés au
// back-end une fois les endpoints de modération disponibles.
type PendingVideo = {
  id: string;
  name: string;
  submittedAt: string;
};

const initialPending: PendingVideo[] = [
  { id: "1", name: "Amina Koné", submittedAt: "Il y a 10 min" },
  { id: "2", name: "Lucas Martin", submittedAt: "Il y a 1 h" },
  { id: "3", name: "Sophia Nguyen", submittedAt: "Il y a 3 h" },
  { id: "4", name: "Youssef Benali", submittedAt: "Il y a 5 h" },
  { id: "5", name: "Emma Dubois", submittedAt: "Hier" },
];

export default function AdminPage() {
  const [pending, setPending] = useState<PendingVideo[]>(initialPending);
  // Vidéo dont on est en train de saisir le motif de refus (null = modal fermé).
  const [rejecting, setRejecting] = useState<PendingVideo | null>(null);
  // Vue active : modération (stats + vidéos à valider) ou tableau des utilisateurs.
  const [view, setView] = useState<"moderation" | "users">("moderation");

  const resolve = (id: string) =>
    setPending((current) => current.filter((video) => video.id !== id));

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

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-bordure-defaut bg-fond-page px-4 py-2 font-sans text-sm font-medium text-texte-secondaire shadow-sm transition-colors hover:bg-fond-neutre"
            >
              7 derniers jours
              <ChevronDownIcon className="size-4 text-texte-tertiaire" />
            </button>
            <span className="hidden items-center gap-2 rounded-full border border-bordure-defaut bg-fond-neutre px-4 py-2 font-sans text-sm font-medium text-texte-secondaire sm:flex">
              <CalendarIcon className="size-4 text-texte-tertiaire" />
              04 fév. – 11 fév.
            </span>
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
            {/* Statistiques */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Carte principale */}
              <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl border border-bordure-defaut bg-fond-page p-6 shadow-sm lg:col-span-4">
                <span className="pointer-events-none absolute right-0 top-0 p-6 text-texte-principal opacity-5">
                  <UserIcon className="size-24" />
                </span>
                <h2 className="mb-2 font-sans text-sm font-medium text-texte-tertiaire">
                  Utilisateurs inscrits
                </h2>
                <div className="flex items-baseline gap-3">
                  <span className="font-sans text-4xl font-bold tracking-tight text-texte-principal">
                    4 944
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-sans text-xs font-semibold text-emerald-700">
                      <ArrowUpRightIcon className="size-3" />
                      +2,1 %
                    </span>
                    <span className="font-sans text-xs text-texte-tertiaire">
                      vs semaine préc.
                    </span>
                  </div>
                </div>
              </div>

              {/* Sous-stats */}
              <div className="flex flex-col divide-y divide-bordure-defaut overflow-hidden rounded-2xl border border-bordure-defaut bg-fond-page shadow-sm sm:flex-row sm:divide-x sm:divide-y-0 lg:col-span-8">
                <div className="flex flex-1 flex-col justify-center p-6">
                  <p className="mb-1 font-sans text-sm font-medium text-texte-tertiaire">
                    Vidéos à valider
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="font-sans text-2xl font-bold text-texte-principal">
                      {pending.length}
                    </span>
                    <VideoIcon className="size-5 text-bleu-institutionnel opacity-30" />
                  </div>
                </div>
                <StatCell label="Moyenne / jour" value="14" delta="1,2" />
                <StatCell label="Inscriptions" value="2 104" delta="142" />
              </div>
            </div>

            <div>
              <div className="mb-6 flex items-center gap-3">
                <h3 className="font-sans text-lg font-bold text-texte-principal">
                  Nouvelles vidéos à valider
                </h3>
                <span className="inline-flex items-center rounded-full border border-bleu-institutionnel/15 bg-fond-bleu-clair px-2.5 py-0.5 font-sans text-xs font-semibold text-bleu-institutionnel">
                  {pending.length} en attente
                </span>
              </div>

              {pending.length === 0 ? (
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
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                  {pending.map((video) => (
                    <PendingCard
                      key={video.id}
                      video={video}
                      onApprove={() => resolve(video.id)}
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
          videoName={rejecting.name}
          onClose={() => setRejecting(null)}
          onConfirm={() => {
            resolve(rejecting.id);
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

function StatCell({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center p-6">
      <p className="mb-1 font-sans text-sm font-medium text-texte-tertiaire">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="font-sans text-2xl font-bold text-texte-principal">
          {value}
        </span>
        <span className="flex items-center font-sans text-xs font-medium text-emerald-600">
          <ArrowUpRightIcon className="mr-0.5 size-3" />
          {delta}
        </span>
      </div>
    </div>
  );
}

function PendingCard({
  video,
  onApprove,
  onReject,
}: {
  video: PendingVideo;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-bordure-defaut bg-fond-page shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-texte-principal">
        <div className="absolute inset-0 bg-gradient-to-tr from-bleu-institutionnel/25 to-texte-principal" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/20 text-texte-inverse shadow-lg backdrop-blur-md transition-colors group-hover:border-bleu-institutionnel group-hover:bg-bleu-institutionnel">
            <PlayIcon className="ml-0.5 size-5" />
          </span>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 font-sans text-xs font-medium text-texte-inverse/90">
          <ClockIcon className="size-3.5" />
          {video.submittedAt}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4
          className="mb-4 truncate font-sans text-sm font-semibold text-texte-principal"
          title={video.name}
        >
          {video.name}
        </h4>

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
