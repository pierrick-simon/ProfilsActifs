"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeftIcon,
  EyeIcon,
  MailIcon,
  MapPinIcon,
  ShareIcon,
} from "@/components/icons";
import { useRole } from "@/hooks/use-role";
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

type VideoItem = {
  url: string | null;
  views?: number;
  userId?: string;
  user?: {
    id?: string | null;
    name?: string | null;
    image?: string | null;
    activitySector?: string | null;
    localisation?: string | null;
  } | null;
};

type Profile = {
  id: string;
  name: string;
  image: string | null;
  role: string | null;
  location: string | null;
  views: number;
  videoUrl: string | null;
};

function formatViews(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(count);
}

export default function ProfileDetail({ userId }: { userId: string }) {
  const isRecruteur = useRole() === "recruteur";
  const { showError } = useToast();
  const { data: session } = authClient.useSession();
  const viewerId = session?.user?.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/videos?userId=${userId}&limit=1`);
        if (!response.ok) {
          throw new Error("profile unavailable");
        }
        const data = await response.json();
        const item: VideoItem | undefined = Array.isArray(data.items)
          ? data.items[0]
          : undefined;

        if (alive) {
          setProfile({
            id: userId,
            name: item?.user?.name ?? "",
            image: item?.user?.image ?? null,
            role: item?.user?.activitySector ?? null,
            location: item?.user?.localisation ?? null,
            views: typeof item?.views === "number" ? item.views : 0,
            videoUrl: item?.url ?? null,
          });
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

  const canContact = isRecruteur && viewerId !== userId;

  return (
    <div className="flex w-full flex-1 flex-col bg-fond-neutre">
      <header className="sticky top-0 z-40 border-b border-bordure-defaut bg-fond-page shadow-sm">
        <div className="w-full px-4 py-4 md:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm font-medium text-texte-secondaire transition-colors hover:bg-fond-neutre hover:text-texte-principal"
          >
            <ChevronLeftIcon className="size-4" />
            Retour aux profils
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 md:flex-row md:p-8">
        {loading || !profile ? (
          <DetailSkeleton />
        ) : (
          <>
            <div className="flex flex-1 flex-col lg:w-2/3">
              <div className="relative mx-auto aspect-[9/16] w-full max-w-md overflow-hidden rounded-2xl bg-texte-principal shadow-lg">
                {profile.videoUrl ? (
                  <video
                    src={profile.videoUrl}
                    poster={profile.image ?? undefined}
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
                    <EyeIcon className="size-4" /> {formatViews(profile.views)} vues
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
                    <h1 className="font-sans text-2xl font-bold text-texte-principal">
                      {profile.name || "Profil"}
                    </h1>
                    {profile.role && (
                      <p className="mt-1 font-sans text-lg font-medium text-bleu-institutionnel">
                        {SECTOR_LABELS[profile.role] ?? profile.role}
                      </p>
                    )}
                  </div>
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-fond-page bg-fond-bleu-clair font-sans text-lg font-medium text-bleu-institutionnel shadow-md">
                    {profile.image ? (
                      <Image
                        src={profile.image}
                        alt={profile.name}
                        width={64}
                        height={64}
                        className="size-full object-cover"
                      />
                    ) : (
                      (profile.name.charAt(0) || "?").toUpperCase()
                    )}
                  </div>
                </div>

                {profile.location && (
                  <div className="mb-6 flex flex-wrap gap-3">
                    <span className="flex items-center gap-1.5 rounded-lg border border-bordure-defaut bg-fond-neutre px-3 py-1.5 font-sans text-sm text-texte-secondaire">
                      <MapPinIcon className="size-4 text-texte-tertiaire" />{" "}
                      {profile.location}
                    </span>
                  </div>
                )}

                {canContact && (
                  <Link
                    href={`/messages/${profile.id}?name=${encodeURIComponent(profile.name)}`}
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
