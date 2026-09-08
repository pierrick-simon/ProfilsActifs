"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import BackButton from "@/components/back-button";
import { ProfileCard, type ProfileVideo } from "@/components/profile-grid";
import { HeartIcon } from "@/components/icons";
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

type UserProfile = {
  id: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  activity?: string | null;
  video_url?: string | null;
  video_views?: number | null;
  favorites?: string[];
};

export default function FavoritesGrid() {
  const { showError } = useToast();
  const { data: session, isPending } = authClient.useSession();
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) {
      return;
    }

    const viewerId = session?.user?.id;
    if (!viewerId) {
      setVideos([]);
      setLoading(false);
      return;
    }

    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const selfResponse = await fetch(`/api/user/${viewerId}`);
        if (!selfResponse.ok) {
          throw new Error("favorites unavailable");
        }
        const self: UserProfile = await selfResponse.json();
        const ids = Array.isArray(self.favorites) ? self.favorites : [];

        const profiles = await Promise.all(
          ids.map(async (id) => {
            const response = await fetch(`/api/user/${id}`);
            if (!response.ok) {
              return null;
            }
            return (await response.json()) as UserProfile;
          }),
        );

        const list: ProfileVideo[] = profiles
          .filter((profile): profile is UserProfile => profile !== null)
          .map((profile) => ({
            id: profile.id,
            url: profile.video_url ?? null,
            name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
            views: typeof profile.video_views === "number" ? profile.video_views : 0,
            role: profile.activity
              ? (SECTOR_LABELS[profile.activity] ?? profile.activity)
              : null,
            location: profile.city ?? null,
            userId: profile.id,
          }));

        if (alive) {
          setVideos(list);
        }
      } catch {
        if (alive) {
          showError("Impossible de charger vos favoris.", "Favoris indisponibles");
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
  }, [isPending, session?.user?.id, showError]);

  return (
    <div className="flex w-full flex-1 flex-col bg-fond-neutre">
      <header className="sticky top-0 z-40 border-b border-bordure-defaut bg-fond-page shadow-sm">
        <div className="w-full px-4 py-6 md:px-8">
          <BackButton href="/" label="Retour aux profils" />
          <div className="mt-4 flex items-center gap-3">
            <h1 className="font-sans text-2xl font-bold text-texte-principal">
              Favoris
            </h1>
            <span className="rounded-full border border-bleu-institutionnel/15 bg-fond-bleu-clair px-2.5 py-1 font-sans text-xs font-semibold text-bleu-institutionnel">
              {loading ? "…" : `${videos.length} profil${videos.length > 1 ? "s" : ""}`}
            </span>
          </div>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col p-4 md:p-8">
        {loading ? (
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[9/16] animate-pulse rounded-2xl bg-fond-page"
              />
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {videos.map((video) => (
              <ProfileCard key={video.userId} video={video} />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
            <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-fond-page text-texte-tertiaire shadow-inner">
              <HeartIcon className="size-9" />
            </div>
            <h2 className="mb-2 font-sans text-2xl font-bold text-texte-principal">
              Aucun favori
            </h2>
            <p className="mx-auto max-w-md font-sans text-sm text-texte-tertiaire">
              Ajoutez des profils à vos favoris depuis leur fiche pour les
              retrouver ici.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
