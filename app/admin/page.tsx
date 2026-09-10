"use client";

import { useEffect, useMemo, useState } from "react";
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
import UserTable, { type ListedUser } from "@/components/user-table";
import FormEditor from "@/components/form-editor";
import BackButton from "@/components/back-button";
import RequireRegistration, { RequireAdmin } from "@/components/require-registration";
import { useToast } from "@/components/toast";
import { authClient } from "@/lib/auth_client";

const STAT_DAYS = 7;

type PendingVideo = {
  id: string;
  name: string;
  submittedAt: string;
  url: string | null;
};

type VideoItem = {
  id: string;
  url?: string | null;
  createdAt?: string;
  validated?: boolean;
  userId?: string;
  user?: {
    id?: string | null;
    name?: string | null;
    localisation?: string | null;
  } | null;
};

function formatSubmittedAt(iso?: string): string {
  if (!iso) {
    return "En attente";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "En attente";
  }
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) {
    return "À l'instant";
  }
  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Il y a ${hours} h`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "Hier";
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function statWindow(now = new Date()) {
  const start = startOfDay(now);
  start.setDate(start.getDate() - (STAT_DAYS - 1));
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - STAT_DAYS);
  return { start, end: now, prevStart, prevEnd: start };
}

function formatRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  return `${start.toLocaleDateString("fr-FR", options)} – ${end.toLocaleDateString("fr-FR", options)}`;
}

function formatCount(value: number): string {
  return value.toLocaleString("fr-FR");
}

function formatAvg(value: number): string {
  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
  });
}

function inRange(iso: string | Date | undefined, from: Date, to: Date): boolean {
  if (!iso) {
    return false;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date >= from && date < to;
}

function formatPercentDelta(current: number, previous: number): string | null {
  if (previous === 0 && current === 0) {
    return null;
  }
  if (previous === 0) {
    return "+100 %";
  }
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.05) {
    return null;
  }
  const rounded =
    Math.abs(pct) >= 10 ? Math.round(pct) : Math.round(pct * 10) / 10;
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${Math.abs(rounded).toLocaleString("fr-FR")} %`;
}

function formatAbsDelta(current: number, previous: number): string | null {
  const diff = current - previous;
  if (Math.abs(diff) < 0.05) {
    return null;
  }
  return formatAvg(Math.abs(diff));
}

async function fetchAllVideos(): Promise<VideoItem[]> {
  const items: VideoItem[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 40; page += 1) {
    const params = new URLSearchParams({ limit: "50" });
    if (cursor) {
      params.set("cursor", cursor);
    }
    const response = await fetch(`/api/videos?${params.toString()}`);
    if (!response.ok) {
      throw new Error("videos unavailable");
    }
    const data = await response.json();
    const batch = Array.isArray(data.items) ? (data.items as VideoItem[]) : [];
    items.push(...batch);
    cursor = data.nextCursor ?? null;
    if (!cursor) {
      break;
    }
  }
  return items;
}

async function fetchAllUsers(): Promise<ListedUser[]> {
  const users: ListedUser[] = [];
  let offset = 0;
  const limit = 50;
  let total = Number.POSITIVE_INFINITY;
  while (offset < total) {
    const { data, error } = await authClient.admin.listUsers({
      query: {
        limit,
        offset,
        sortBy: "createdAt",
        sortDirection: "desc",
      },
    });
    if (error || !data) {
      throw new Error(error?.message ?? "users unavailable");
    }
    const batch = (data.users ?? []) as ListedUser[];
    users.push(...batch);
    total = typeof data.total === "number" ? data.total : users.length;
    offset += batch.length;
    if (batch.length === 0) {
      break;
    }
  }
  return users;
}

function toPending(item: VideoItem): PendingVideo {
  return {
    id: item.id,
    name: item.user?.name || "Profil",
    submittedAt: formatSubmittedAt(item.createdAt),
    url: item.url ?? null,
  };
}

export default function AdminPage() {
  return (
    <RequireRegistration>
      <RequireAdmin>
        <AdminModeration />
      </RequireAdmin>
    </RequireRegistration>
  );
}

function AdminModeration() {
  const { showError } = useToast();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PendingVideo | null>(null);
  const [watching, setWatching] = useState<PendingVideo | null>(null);
  const [view, setView] = useState<"moderation" | "users" | "form">("moderation");
  const windowBounds = useMemo(() => statWindow(), []);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [videoResult, userResult] = await Promise.allSettled([
          fetchAllVideos(),
          fetchAllUsers(),
        ]);
        if (!alive) {
          return;
        }
        if (videoResult.status === "fulfilled") {
          setVideos(videoResult.value);
        } else {
          showError("Impossible de charger les vidéos à valider.", "Modération");
        }
        if (userResult.status === "fulfilled") {
          setUsers(userResult.value);
        } else {
          showError("Impossible de charger les utilisateurs.", "Modération");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [showError]);

  const pendingItems = useMemo(
    () => videos.filter((video) => video.validated === false),
    [videos],
  );
  const pending = useMemo(
    () => pendingItems.map(toPending),
    [pendingItems],
  );

  const stats = useMemo(() => {
    const { start, end, prevStart, prevEnd } = windowBounds;
    const inscriptions = users.filter((user) =>
      inRange(user.createdAt, start, end),
    ).length;
    const inscriptionsPrev = users.filter((user) =>
      inRange(user.createdAt, prevStart, prevEnd),
    ).length;
    const videosNow = videos.filter((video) =>
      inRange(video.createdAt, start, end),
    ).length;
    const videosPrev = videos.filter((video) =>
      inRange(video.createdAt, prevStart, prevEnd),
    ).length;
    const avg = videosNow / STAT_DAYS;
    const avgPrev = videosPrev / STAT_DAYS;
    return {
      totalUsers: users.length,
      inscriptions,
      userDelta: formatPercentDelta(inscriptions, inscriptionsPrev),
      userTrend: inscriptions >= inscriptionsPrev ? "up" : "down",
      avgPerDay: avg,
      avgDelta: formatAbsDelta(avg, avgPrev),
      avgTrend: avg >= avgPrev ? "up" : "down",
      inscriptionsDelta: formatAbsDelta(inscriptions, inscriptionsPrev),
      inscriptionsTrend:
        inscriptions >= inscriptionsPrev ? "up" : "down",
    };
  }, [users, videos, windowBounds]);

  async function approve(id: string) {
    if (actingId) {
      return;
    }
    setActingId(id);
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validated: true }),
      });
      if (!response.ok) {
        throw new Error("approve failed");
      }
      setVideos((current) =>
        current.map((video) =>
          video.id === id ? { ...video, validated: true } : video,
        ),
      );
    } catch {
      showError("Impossible d'approuver cette vidéo.", "Validation échouée");
    } finally {
      setActingId(null);
    }
  }

  async function reject(id: string) {
    if (actingId) {
      return;
    }
    setActingId(id);
    try {
      const response = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        throw new Error("reject failed");
      }
      setVideos((current) => current.filter((video) => video.id !== id));
      setRejecting(null);
    } catch {
      showError("Impossible de refuser cette vidéo.", "Refus échoué");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col border-x border-bordure-defaut bg-fond-page">
      {/* En-tête */}
      <header className="px-6 py-6 md:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <BackButton href="/" label="Retour" />
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
              {formatRange(windowBounds.start, windowBounds.end)}
            </span>
          </div>
        </div>
      </header>

      <div className="h-px w-full bg-bordure-defaut" />

      {/* Contenu */}
      <main className="flex flex-1 flex-col bg-fond-neutre/40 p-6 md:p-10">
        {/* Bascule modération / utilisateurs / questions */}
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
            <ViewTab
              label="Questions"
              active={view === "form"}
              onClick={() => setView("form")}
            />
          </div>
        </div>

        {view === "users" ? (
          <UserTable users={users} videos={videos} loading={loading} />
        ) : view === "form" ? (
          <FormEditor />
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
                    {loading ? "—" : formatCount(stats.totalUsers)}
                  </span>
                  {!loading && stats.userDelta ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-sans text-xs font-semibold ${
                          stats.userTrend === "up"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-fond-neutre text-texte-secondaire"
                        }`}
                      >
                        {stats.userTrend === "up" ? (
                          <ArrowUpRightIcon className="size-3" />
                        ) : null}
                        {stats.userDelta}
                      </span>
                      <span className="font-sans text-xs text-texte-tertiaire">
                        vs semaine préc.
                      </span>
                    </div>
                  ) : null}
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
                      {loading ? "—" : pending.length}
                    </span>
                    <VideoIcon className="size-5 text-bleu-institutionnel opacity-30" />
                  </div>
                </div>
                <StatCell
                  label="Moyenne / jour"
                  value={loading ? "—" : formatAvg(stats.avgPerDay)}
                  delta={loading ? null : stats.avgDelta}
                  up={stats.avgTrend === "up"}
                />
                <StatCell
                  label="Inscriptions"
                  value={loading ? "—" : formatCount(stats.inscriptions)}
                  delta={loading ? null : stats.inscriptionsDelta}
                  up={stats.inscriptionsTrend === "up"}
                />
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

              {loading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] animate-pulse rounded-xl bg-fond-page"
                    />
                  ))}
                </div>
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
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                  {pending.map((video) => (
                    <PendingCard
                      key={video.id}
                      video={video}
                      busy={actingId === video.id}
                      onWatch={() => setWatching(video)}
                      onApprove={() => approve(video.id)}
                      onReject={() => setRejecting(video)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {watching && (
        <WatchVideoModal video={watching} onClose={() => setWatching(null)} />
      )}
      {rejecting && (
        <RejectVideoModal
          videoName={rejecting.name}
          onClose={() => setRejecting(null)}
          onConfirm={() => {
            reject(rejecting.id);
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
  up,
}: {
  label: string;
  value: string;
  delta: string | null;
  up: boolean;
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
        {delta ? (
          <span
            className={`flex items-center font-sans text-xs font-medium ${
              up ? "text-emerald-600" : "text-texte-tertiaire"
            }`}
          >
            {up ? <ArrowUpRightIcon className="mr-0.5 size-3" /> : null}
            {up ? delta : `−${delta}`}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function PendingCard({
  video,
  busy,
  onWatch,
  onApprove,
  onReject,
}: {
  video: PendingVideo;
  busy: boolean;
  onWatch: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-bordure-defaut bg-fond-page shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onWatch}
        disabled={!video.url}
        aria-label={`Lire la vidéo de ${video.name}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-texte-principal disabled:cursor-not-allowed"
      >
        {video.url ? (
          <video
            src={video.url}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(event) => {
              event.currentTarget.currentTime = 0.1;
            }}
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-bleu-institutionnel/25 to-texte-principal" />
        )}
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
      </button>

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
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-bleu-institutionnel py-2.5 font-sans text-sm font-medium text-texte-inverse shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckIcon className="size-4" />
            Approuver
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            aria-label="Rejeter"
            title="Rejeter"
            className="flex size-[42px] shrink-0 items-center justify-center rounded-lg border border-bordure-defaut bg-fond-page text-texte-secondaire transition-colors hover:border-erreur/30 hover:bg-erreur/10 hover:text-erreur disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function WatchVideoModal({
  video,
  onClose,
}: {
  video: PendingVideo;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-texte-principal/80 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Vidéo de ${video.name}`}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-black shadow-2xl"
      >
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="text-texte-inverse">
            <h3 className="font-sans text-sm font-medium">{video.name}</h3>
            <p className="font-sans text-xs text-texte-inverse/70">
              Vidéo de présentation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full bg-black/20 p-2 text-texte-inverse/80 backdrop-blur-md transition-all hover:bg-black/40 hover:text-texte-inverse"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="relative aspect-[3/4] w-full bg-texte-principal">
          {video.url ? (
            <video
              src={video.url}
              controls
              autoPlay
              playsInline
              className="absolute inset-0 size-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-bleu-institutionnel/30 to-texte-principal px-6 text-center">
              <span className="font-sans text-sm font-medium text-texte-inverse/70">
                Aucune vidéo disponible.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
