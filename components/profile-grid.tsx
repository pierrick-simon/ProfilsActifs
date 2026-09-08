"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  MapPinIcon,
  PlayIcon,
  SearchIcon,
  SettingsIcon,
} from "@/components/icons";
import { useViewerRole } from "@/hooks/use-role";
import { useToast } from "@/components/toast";
import { authClient } from "@/lib/auth_client";

const PAGE_SIZE = 20;

// Libellés FR des secteurs d'activité stockés en enum en base.
const SECTOR_LABELS: Record<string, string> = {
  TECHNOLOGY: "Technologie",
  FINANCE: "Finance",
  HEALTHCARE: "Santé",
  EDUCATION: "Éducation",
  RETAIL: "Commerce",
  MANUFACTURING: "Industrie",
  CONSULTING: "Conseil",
  MEDIA: "Médias",
  GOVERNMENT: "Secteur public",
  OTHER: "Autre",
};

type CertifiedFilter = "all" | "true" | "false";

const SECTOR_OPTIONS = Object.entries(SECTOR_LABELS);

export type ProfileVideo = {
  id: string;
  url: string | null;
  name: string;
  views: number;
  role: string | null;
  location: string | null;
  userId: string;
};

type VideoItem = {
  id: string;
  url: string | null;
  views?: number;
  userId?: string;
  user?: {
    id?: string | null;
    name?: string | null;
    activitySector?: string | null;
    localisation?: string | null;
  } | null;
};

function formatViews(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(count);
}

function catalogQuery(params: {
  canBrowse: boolean;
  userId: string | null;
  cursor: string | null;
  sector: string;
  location: string;
  certified: CertifiedFilter;
}): string | null {
  if (!params.canBrowse && !params.userId) {
    return null;
  }

  const search = new URLSearchParams({
    limit: String(PAGE_SIZE),
    sortBy: "date",
  });
  if (!params.canBrowse && params.userId) {
    search.set("userId", params.userId);
  }
  if (params.cursor) {
    search.set("cursor", params.cursor);
  }
  if (params.sector) {
    search.set("sector", params.sector);
  }
  if (params.location) {
    search.set("location", params.location);
  }
  if (params.certified === "true" || params.certified === "false") {
    search.set("certified", params.certified);
  }
  return `/api/videos?${search.toString()}`;
}

export default function ProfileGrid() {
  const { isRecruiter, isAdmin, isPending: rolePending } = useViewerRole();
  const canBrowse = isRecruiter || isAdmin;
  const { showError } = useToast();
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id ?? null;

  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageCursors, setPageCursors] = useState<(string | null)[]>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sector, setSector] = useState("");
  const [location, setLocation] = useState("");
  const [certified, setCertified] = useState<CertifiedFilter>("all");
  const [draftSector, setDraftSector] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftCertified, setDraftCertified] = useState<CertifiedFilter>("all");

  const activeFilterCount =
    (sector ? 1 : 0) +
    (location ? 1 : 0) +
    (certified !== "all" ? 1 : 0);

  useEffect(() => {
    if (isPending || rolePending) {
      return;
    }

    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const url = catalogQuery({
          canBrowse,
          userId,
          cursor: pageCursors[page],
          sector,
          location,
          certified,
        });

        if (!url) {
          if (alive) {
            setVideos([]);
            setNextCursor(null);
          }
          return;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("feed unavailable");
        }
        const data = await response.json();

        const list: ProfileVideo[] = (
          Array.isArray(data.items) ? (data.items as VideoItem[]) : []
        ).map((v) => ({
          id: v.id,
          url: v.url ?? null,
          name: v.user?.name ?? "",
          views: typeof v.views === "number" ? v.views : 0,
          role: v.user?.activitySector
            ? SECTOR_LABELS[v.user.activitySector] ?? null
            : null,
          location: v.user?.localisation ?? null,
          userId: v.userId ?? v.user?.id ?? "",
        }));

        if (alive) {
          setVideos(list);
          setNextCursor(data.nextCursor ?? null);
        }
      } catch {
        if (alive) {
          showError("Impossible de charger les profils.", "Fil indisponible");
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
  }, [
    page,
    pageCursors,
    canBrowse,
    userId,
    isPending,
    rolePending,
    showError,
    sector,
    location,
    certified,
  ]);

  const displayed = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return videos;
    }
    return videos.filter((v) => v.name.toLowerCase().includes(term));
  }, [videos, search]);

  function goNext() {
    if (nextCursor === null) {
      return;
    }
    setPageCursors((prev) =>
      prev.length > page + 1 ? prev : [...prev, nextCursor],
    );
    setPage((p) => p + 1);
  }

  function goToPage(target: number) {
    if (target >= 0 && target < pageCursors.length) {
      setPage(target);
    }
  }

  function openFilters() {
    setDraftSector(sector);
    setDraftLocation(location);
    setDraftCertified(certified);
    setFiltersOpen((open) => !open);
  }

  function applyFilters() {
    setSector(draftSector);
    setLocation(draftLocation.trim());
    setCertified(draftCertified);
    setPage(0);
    setPageCursors([null]);
    setFiltersOpen(false);
  }

  function resetFilters() {
    setSearch("");
    setSector("");
    setLocation("");
    setCertified("all");
    setDraftSector("");
    setDraftLocation("");
    setDraftCertified("all");
    setPage(0);
    setPageCursors([null]);
    setFiltersOpen(false);
  }

  const hasAnyVideos = videos.length > 0;

  return (
    <div className="flex w-full flex-1 flex-col bg-fond-neutre">
      <header className="sticky top-0 z-40 border-b border-bordure-defaut bg-fond-page shadow-sm">
        <div className="w-full px-4 py-6 md:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-sans text-2xl font-bold text-texte-principal">
                  Profils
                </h1>
                <span className="rounded-full border border-bleu-institutionnel/15 bg-fond-bleu-clair px-2.5 py-1 font-sans text-xs font-semibold text-bleu-institutionnel">
                  {hasAnyVideos ? `${displayed.length} profils` : "0 profil"}
                </span>
              </div>
              <p className="mt-1 font-sans text-sm text-texte-tertiaire">
                Découvrez les meilleurs talents en vidéo pour votre équipe.
              </p>
            </div>

            <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
              <div className="relative w-full sm:w-64">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texte-tertiaire" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher par nom..."
                  className="w-full rounded-lg border border-bordure-defaut bg-fond-neutre py-2 pl-10 pr-4 font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
                />
              </div>
              <button
                type="button"
                onClick={openFilters}
                aria-expanded={filtersOpen}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 font-sans text-sm font-medium transition-colors sm:w-auto ${
                  filtersOpen || activeFilterCount > 0
                    ? "border-bleu-institutionnel/20 bg-fond-bleu-clair text-bleu-institutionnel"
                    : "border-bordure-defaut bg-fond-page text-texte-secondaire hover:bg-fond-neutre hover:text-bleu-institutionnel"
                }`}
              >
                <SettingsIcon className="size-4" />
                Filtres
                {activeFilterCount > 0 ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-bleu-institutionnel font-sans text-[10px] font-semibold text-texte-inverse">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {filtersOpen ? (
            <CatalogFilters
              sector={draftSector}
              location={draftLocation}
              certified={draftCertified}
              onSector={setDraftSector}
              onLocation={setDraftLocation}
              onCertified={setDraftCertified}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          ) : null}
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col p-4 md:p-8">
        {loading ? (
          <SkeletonGrid />
        ) : displayed.length > 0 ? (
          <>
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {displayed.map((video) => (
                <ProfileCard key={video.id} video={video} />
              ))}
            </div>
            <Pager
              page={page}
              pageCount={pageCursors.length}
              hasNext={nextCursor !== null}
              loading={loading}
              onPrev={() => goToPage(page - 1)}
              onNext={goNext}
              onGoTo={goToPage}
            />
          </>
        ) : !hasAnyVideos && !canBrowse ? (
          <CandidateEmpty />
        ) : (
          <NoResults onReset={resetFilters} />
        )}
      </main>
    </div>
  );
}

function CatalogFilters({
  sector,
  location,
  certified,
  onSector,
  onLocation,
  onCertified,
  onApply,
  onReset,
}: {
  sector: string;
  location: string;
  certified: CertifiedFilter;
  onSector: (value: string) => void;
  onLocation: (value: string) => void;
  onCertified: (value: CertifiedFilter) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const fieldClass =
    "w-full rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2 font-sans text-sm text-texte-principal focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair";

  return (
    <form
      className="mt-4 grid gap-3 rounded-xl border border-bordure-defaut bg-fond-neutre/60 p-4 sm:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="font-sans text-xs font-semibold uppercase tracking-wider text-texte-tertiaire">
          Secteur
        </span>
        <select
          value={sector}
          onChange={(event) => onSector(event.target.value)}
          className={fieldClass}
        >
          <option value="">Tous</option>
          {SECTOR_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-sans text-xs font-semibold uppercase tracking-wider text-texte-tertiaire">
          Localisation
        </span>
        <input
          type="text"
          value={location}
          onChange={(event) => onLocation(event.target.value)}
          placeholder="Ville ou code postal"
          autoComplete="off"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-sans text-xs font-semibold uppercase tracking-wider text-texte-tertiaire">
          Certification
        </span>
        <select
          value={certified}
          onChange={(event) =>
            onCertified(event.target.value as CertifiedFilter)
          }
          className={fieldClass}
        >
          <option value="all">Tous</option>
          <option value="true">Certifiés</option>
          <option value="false">Non certifiés</option>
        </select>
      </label>

      <div className="flex flex-wrap justify-end gap-2 sm:col-span-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-bordure-defaut bg-fond-page px-4 py-2 font-sans text-sm font-medium text-texte-secondaire transition-colors hover:bg-fond-neutre hover:text-texte-principal"
        >
          Réinitialiser
        </button>
        <button
          type="submit"
          className="rounded-lg bg-bleu-institutionnel px-4 py-2 font-sans text-sm font-medium text-texte-inverse shadow-sm transition-colors hover:brightness-110"
        >
          Appliquer
        </button>
      </div>
    </form>
  );
}

export function ProfileCard({ video }: { video: ProfileVideo }) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const [previewing, setPreviewing] = useState(false);

  function startPreview() {
    const element = previewRef.current;
    if (!element) {
      return;
    }
    setPreviewing(true);
    // Le navigateur peut refuser la lecture (économie de données, onglet inactif) :
    // on retombe alors sur la vignette au lieu de laisser la carte en lecture fantôme.
    element.play().catch(() => setPreviewing(false));
  }

  function stopPreview() {
    setPreviewing(false);
    const element = previewRef.current;
    if (element) {
      element.pause();
      element.currentTime = 0;
    }
  }

  return (
    <Link
      href={`/profil/${video.userId}`}
      aria-label={`Voir le profil de ${video.name || "ce candidat"}`}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onFocus={startPreview}
      onBlur={stopPreview}
      className="group relative block aspect-[9/16] overflow-hidden rounded-2xl bg-texte-principal text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-bleu-institutionnel"
    >
      {video.url ? (
        <video
          ref={previewRef}
          src={video.url}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          // Sans ce léger décalage, plusieurs navigateurs n'affichent aucune image
          // tant que la vidéo n'a pas démarré et la carte reste noire.
          onLoadedMetadata={(event) => {
            event.currentTarget.currentTime = 0.1;
          }}
          className="pointer-events-none absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-bleu-institutionnel/25 to-texte-principal transition-transform duration-700 group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          previewing ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex size-16 items-center justify-center rounded-full border border-white/30 bg-white/20 text-texte-inverse shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-bleu-institutionnel group-hover:bg-bleu-institutionnel">
          <PlayIcon className="ml-0.5 size-6" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex translate-y-0 flex-col gap-1 p-5 transition-transform duration-300 group-hover:-translate-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-sans text-lg font-bold leading-tight text-texte-inverse">
            {video.name || "Profil"}
          </h3>
          <span className="flex items-center gap-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 font-sans text-xs font-medium text-texte-inverse backdrop-blur-sm">
            <EyeIcon className="size-3.5" /> {formatViews(video.views)}
          </span>
        </div>
        {video.role && (
          <p className="font-sans text-sm font-medium text-white/80">
            {video.role}
          </p>
        )}
        {video.location && (
          <p className="mt-1 flex items-center gap-1 font-sans text-xs text-white/60">
            <MapPinIcon className="size-3.5" /> {video.location}
          </p>
        )}
      </div>
    </Link>
  );
}

type PagerProps = {
  page: number;
  pageCount: number;
  hasNext: boolean;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (target: number) => void;
};

function Pager({ page, pageCount, hasNext, loading, onPrev, onNext, onGoTo }: PagerProps) {
  if (pageCount <= 1 && !hasNext) {
    return null;
  }

  return (
    <div className="mb-8 mt-12 flex w-full flex-col items-center justify-center gap-4">
      <p aria-live="polite" className="font-sans text-sm font-medium text-texte-tertiaire">
        Page {page + 1}
      </p>
      <nav aria-label="Pagination" className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page === 0 || loading}
          aria-label="Page précédente"
          className="flex items-center justify-center gap-1 rounded-lg border border-bordure-defaut bg-fond-page px-4 py-2 font-sans text-sm font-medium text-texte-secondaire transition-colors hover:bg-fond-neutre hover:text-texte-principal disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeftIcon className="size-4" /> Précédent
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onGoTo(i)}
              aria-current={i === page ? "page" : undefined}
              aria-label={`Aller à la page ${i + 1}`}
              className={`flex size-10 items-center justify-center rounded-lg font-sans text-sm transition-colors ${
                i === page
                  ? "border border-bleu-institutionnel/20 bg-fond-bleu-clair font-semibold text-bleu-institutionnel"
                  : "font-medium text-texte-secondaire hover:bg-fond-neutre"
              }`}
            >
              {i + 1}
            </button>
          ))}
          {hasNext && (
            <span className="flex size-10 items-center justify-center text-texte-tertiaire">
              ...
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext || loading}
          aria-label="Page suivante"
          className="flex items-center justify-center gap-1 rounded-lg border border-bordure-defaut bg-fond-page px-4 py-2 font-sans text-sm font-medium text-texte-principal transition-colors hover:bg-fond-neutre disabled:cursor-not-allowed disabled:opacity-50"
        >
          Suivant <ChevronRightIcon className="size-4" />
        </button>
      </nav>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="relative aspect-[9/16] animate-pulse overflow-hidden rounded-2xl bg-fond-neutre"
        >
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
            <div className="h-5 w-2/3 rounded bg-bordure-defaut" />
            <div className="h-4 w-1/2 rounded bg-bordure-defaut" />
            <div className="mt-2 h-3 w-1/3 rounded bg-bordure-defaut" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-fond-neutre text-texte-tertiaire shadow-inner">
        <SearchIcon className="size-9" />
      </div>
      <h2 className="mb-2 font-sans text-2xl font-bold text-texte-principal">
        Aucun profil trouvé
      </h2>
      <p className="mx-auto mb-8 max-w-md font-sans text-sm text-texte-tertiaire">
        Nous n&apos;avons trouvé aucun candidat correspondant à votre recherche.
        Essayez de modifier vos filtres ou vos termes de recherche.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="rounded-lg bg-bleu-institutionnel px-6 py-3 font-sans text-sm font-medium text-texte-inverse shadow-sm transition-colors hover:brightness-110"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}

function CandidateEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <p className="font-sans text-sm text-texte-tertiaire">
        Vous n&apos;avez pas encore publié de vidéo.
      </p>
      <Link
        href="/inscription/video"
        className="inline-flex items-center justify-center rounded-[10px] bg-bleu-institutionnel px-4 py-2.5 font-sans text-sm font-medium text-texte-inverse transition-colors hover:brightness-110"
      >
        Ajouter ma vidéo
      </Link>
    </div>
  );
}
