"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import BackButton from "@/components/back-button";
import { ProfileCard, type ProfileVideo } from "@/components/profile-grid";
import { HeartIcon } from "@/components/icons";

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

type FavoriteItem = {
  id: string;
  userId: string;
  name: string;
  location: string | null;
  role: string | null;
  url: string | null;
  views: number;
};

export default function FavoritesGrid() {
  const { showError } = useToast();
  const [videos, setVideos] = useState<ProfileVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/user/favories");
        if (!response.ok) {
          throw new Error("favorites unavailable");
        }
        const data = await response.json();
        const list: ProfileVideo[] = (
          Array.isArray(data.items) ? (data.items as FavoriteItem[]) : []
        ).map((item) => ({
          id: item.id,
          url: item.url,
          name: item.name,
          views: item.views,
          role: item.role ? (SECTOR_LABELS[item.role] ?? item.role) : null,
          location: item.location,
          userId: item.userId,
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
  }, [showError]);

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
