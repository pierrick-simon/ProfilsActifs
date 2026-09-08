"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckIcon,
  EyeIcon,
  HeartIcon,
  MailIcon,
  MapPinIcon,
  ShareIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import BackButton from "@/components/back-button";
import { useViewerRole } from "@/hooks/use-role";
import { useToast } from "@/components/toast";
import { authClient } from "@/lib/auth_client";

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

const STATUS_LABELS: Record<string, string> = {
  ready: "Prête",
  pending: "En traitement",
  failed: "Échec",
};

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  activity: string | null;
  certification_date: string | null;
  favory?: number;
  favory_today?: number;
  video_url: string | null;
  video_status: string | null;
  video_views: number | null;
  video_validated: boolean | null;
  is_favorited?: boolean;
};

function formatViews(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(count);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ProfileDetail({ userId }: { userId: string }) {
  const { isRecruiter } = useViewerRole();
  const { showError } = useToast();
  const { data: session } = authClient.useSession();
  const viewerId = session?.user?.id ?? null;
  const isOwnProfile = viewerId === userId;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [favoriting, setFavoriting] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/user/${userId}`);
        if (!response.ok) {
          throw new Error("profile unavailable");
        }
        const data: UserProfile = await response.json();
        if (alive) {
          setProfile(data);
          setFavorited(Boolean(data.is_favorited));
        }
      } catch {
        if (alive) {
          showError("Impossible de charger ce profil.", "Profil indisponible");
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
  }, [userId, showError]);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      showError("Impossible de copier le lien.", "Partage échoué");
    }
  }

  async function toggleFavorite() {
    if (favoriting) {
      return;
    }
    const next = !favorited;
    setFavorited(next);
    setFavoriting(true);
    try {
      const response = await fetch(`/api/user/${userId}/favory`, {
        method: next ? "POST" : "DELETE",
      });
      if (!response.ok) {
        throw new Error("favorite failed");
      }
      setProfile((current) =>
        current
          ? {
              ...current,
              favory: Math.max(0, current.favory + (next ? 1 : -1)),
            }
          : current,
      );
    } catch {
      setFavorited(!next);
      showError("Impossible de mettre à jour les favoris.", "Favoris");
    } finally {
      setFavoriting(false);
    }
  }

  const canContact = isRecruiter && !isOwnProfile;
  const canFavorite = isRecruiter && !isOwnProfile;
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "";
  const avatar = isOwnProfile ? (session?.user?.image ?? null) : null;

  return (
    <div className="flex w-full flex-1 flex-col bg-fond-neutre">
      <header className="sticky top-0 z-40 border-b border-bordure-defaut bg-fond-page shadow-sm">
        <div className="w-full px-4 py-4 md:px-8">
          <BackButton
            href="/"
            label={isOwnProfile ? "Retour" : "Retour aux profils"}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 md:flex-row md:p-8">
        {loading || !profile ? (
          <DetailSkeleton />
        ) : (
          <>
            <div className="flex flex-1 flex-col lg:w-2/3">
              <div className="relative mx-auto aspect-[9/16] w-full max-w-md overflow-hidden rounded-2xl bg-texte-principal shadow-lg">
                {profile.video_url ? (
                  <video
                    src={profile.video_url}
                    controls
                    autoPlay
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-bleu-institutionnel/25 to-texte-principal px-6 text-center">
                    <span className="font-sans text-sm font-medium text-texte-inverse/70">
                      Aucune vidéo disponible.
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 font-sans text-sm text-texte-tertiaire">
                  <span className="flex items-center gap-1">
                    <EyeIcon className="size-4" />{" "}
                    {formatViews(profile.video_views ?? 0)} vues
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  title="Partager"
                  className="rounded-lg p-2 text-texte-tertiaire transition-colors hover:bg-fond-bleu-clair hover:text-bleu-institutionnel"
                >
                  <ShareIcon className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex w-full flex-col gap-6 lg:w-1/3">
              <div className="rounded-2xl border border-bordure-defaut bg-fond-page p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-sans text-2xl font-bold text-texte-principal">
                        {displayName || "Profil"}
                      </h1>
                      {profile.certification_date && (
                        <span
                          title={`Certifié le ${formatDate(profile.certification_date)}`}
                          className="inline-flex items-center gap-1 rounded-full bg-bleu-institutionnel px-2 py-0.5 font-sans text-xs font-semibold text-texte-inverse"
                        >
                          <ShieldCheckIcon className="size-3.5" />
                          Certifié
                        </span>
                      )}
                    </div>
                    {profile.activity && (
                      <p className="mt-1 font-sans text-lg font-medium text-bleu-institutionnel">
                        {SECTOR_LABELS[profile.activity] ?? profile.activity}
                      </p>
                    )}
                  </div>
                  <div className="relative size-16 shrink-0">
                    <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-fond-page bg-fond-bleu-clair font-sans text-lg font-medium text-bleu-institutionnel shadow-md">
                      {avatar ? (
                        <Image
                          src={avatar}
                          alt={displayName}
                          width={64}
                          height={64}
                          className="size-full object-cover"
                        />
                      ) : (
                        (displayName.charAt(0) || "?").toUpperCase()
                      )}
                    </div>
                    {profile.certification_date && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-fond-page bg-bleu-institutionnel text-texte-inverse">
                        <CheckIcon className="size-2.5" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-3">
                  {profile.city && (
                    <span className="flex items-center gap-1.5 rounded-lg border border-bordure-defaut bg-fond-neutre px-3 py-1.5 font-sans text-sm text-texte-secondaire">
                      <MapPinIcon className="size-4 text-texte-tertiaire" />{" "}
                      {profile.city}
                    </span>
                  )}
                </div>

                {isOwnProfile && (
                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <StatChip label="Favoris" value={String(profile.favory ?? 0)} />
                    <StatChip
                      label="Aujourd'hui"
                      value={String(profile.favory_today ?? 0)}
                    />
                  </div>
                )}

                {isOwnProfile && (
                  <div className="mb-6 flex flex-col gap-1 rounded-lg border border-bordure-defaut bg-fond-neutre px-3 py-2.5">
                    <span className="font-sans text-xs text-texte-tertiaire">
                      Statut de la vidéo
                    </span>
                    <span className="font-sans text-sm font-medium text-texte-principal">
                      {profile.video_validated
                        ? "Validée"
                        : profile.video_url
                          ? "En attente de validation"
                          : "Aucune vidéo"}
                      {profile.video_status
                        ? ` · ${STATUS_LABELS[profile.video_status] ?? profile.video_status}`
                        : ""}
                    </span>
                  </div>
                )}

                {isOwnProfile && !profile.video_url && (
                  <Link
                    href="/inscription/video"
                    className="mb-3 flex w-full items-center justify-center rounded-lg border border-bordure-defaut bg-fond-page px-4 py-2.5 font-sans text-sm font-medium text-texte-secondaire transition-colors hover:bg-fond-neutre"
                  >
                    Ajouter ma vidéo
                  </Link>
                )}

                {canFavorite && (
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    disabled={favoriting}
                    className={`mb-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-sans text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      favorited
                        ? "border border-bleu-institutionnel bg-fond-bleu-clair text-bleu-institutionnel"
                        : "border border-bordure-defaut bg-fond-page text-texte-secondaire hover:bg-fond-neutre"
                    }`}
                  >
                    <HeartIcon className="size-4" filled={favorited} />
                    {favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
                  </button>
                )}

                {canContact && (
                  <Link
                    href={`/messages/${profile.id}?name=${encodeURIComponent(displayName)}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-bleu-institutionnel px-4 py-2.5 font-sans text-sm font-medium text-texte-inverse transition-colors hover:brightness-110"
                  >
                    <MailIcon className="size-4" />
                    Contacter
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-bordure-defaut bg-fond-neutre px-3 py-2">
      <p className="font-sans text-xs text-texte-tertiaire">{label}</p>
      <p className="font-sans text-lg font-semibold text-texte-principal">
        {value}
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="flex flex-1 flex-col lg:w-2/3">
        <div className="mx-auto aspect-[9/16] w-full max-w-md animate-pulse rounded-2xl bg-bordure-defaut" />
      </div>
      <div className="flex w-full flex-col gap-6 lg:w-1/3">
        <div className="h-64 animate-pulse rounded-2xl bg-bordure-defaut" />
      </div>
    </>
  );
}
