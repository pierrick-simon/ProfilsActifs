"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/icons";
import { useRole } from "@/hooks/use-role";
import { useToast } from "@/components/toast";
import { authClient } from "@/lib/auth_client";
import { useCurrentProfile } from "@/components/current-profile";

type FeedVideo = {
  id: string;
  video_url: string;
  name: string;
  userId: string;
};

type VideoItem = {
  id: string;
  url: string;
  userId?: string;
  user?: { id?: string | null; name?: string | null } | null;
};

export default function VideoFeed() {
  const isRecruteur = useRole() === "recruteur";
  const { showError } = useToast();
  const { setProfile } = useCurrentProfile();
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id ?? null;
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (isPending) {
      return;
    }

    let active = true;
    async function load() {
      setLoading(true);
      try {
        const endpoint = isRecruteur
          ? "/api/videos?limit=20"
          : userId
            ? `/api/videos?userId=${userId}&limit=20`
            : null;

        if (!endpoint) {
          if (active) {
            setVideos([]);
          }
          return;
        }

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error("feed unavailable");
        }
        const data = await response.json();

        const list: FeedVideo[] = (
          Array.isArray(data.items) ? (data.items as VideoItem[]) : []
        ).map((v) => ({
          id: v.id,
          video_url: v.url,
          name: v.user?.name ?? "",
          userId: v.userId ?? v.user?.id ?? "",
        }));

        if (active) {
          setVideos(list);
        }
      } catch {
        if (active) {
          showError("Impossible de charger les vidéos.", "Fil indisponible");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [isRecruteur, userId, isPending, showError]);

  const hasVideos = videos.length > 0;
  const current = hasVideos ? videos[index] : null;

  useEffect(() => {
    setProfile(
      current ? { name: current.name, userId: current.userId } : null,
    );
  }, [current, setProfile]);

  const goPrev = () =>
    setIndex((c) => (c - 1 + videos.length) % videos.length);
  const goNext = () => setIndex((c) => (c + 1) % videos.length);

  return (
    <div className="flex w-full items-center justify-center gap-4">
      {isRecruteur && hasVideos && (
        <div className="flex flex-col gap-3">
          <FeedArrow ariaLabel="Vidéo précédente" onClick={goPrev}>
            <ChevronUpIcon className="size-5" />
          </FeedArrow>
          <FeedArrow ariaLabel="Vidéo suivante" onClick={goNext}>
            <ChevronDownIcon className="size-5" />
          </FeedArrow>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <div className="relative aspect-[9/16] h-[calc(100dvh-6rem)] max-h-[960px] w-auto overflow-hidden rounded-2xl bg-texte-principal">
          {current ? (
            <video
              key={current.id}
              src={current.video_url}
              controls
              playsInline
              loop
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              {loading ? (
                <span className="font-sans text-sm font-medium text-texte-inverse/70">
                  Chargement des vidéos...
                </span>
              ) : isRecruteur ? (
                <span className="font-sans text-sm font-medium text-texte-inverse/70">
                  Aucune vidéo pour le moment.
                </span>
              ) : (
                <>
                  <span className="font-sans text-sm font-medium text-texte-inverse/70">
                    Vous n&apos;avez pas encore publié de vidéo.
                  </span>
                  <Link
                    href="/inscription/video"
                    className="inline-flex items-center justify-center rounded-[10px] bg-fond-page px-4 py-2.5 font-sans text-sm font-medium text-texte-principal shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)] transition-colors hover:bg-fond-neutre"
                  >
                    Ajouter ma vidéo
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {hasVideos && (
          <span className="font-sans text-xs text-texte-tertiaire">
            Vidéo {index + 1} / {videos.length}
          </span>
        )}
      </div>
    </div>
  );
}

type FeedArrowProps = {
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
};

function FeedArrow({ ariaLabel, onClick, children }: FeedArrowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex size-10 items-center justify-center rounded-full border border-bordure-defaut bg-fond-page text-texte-secondaire shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] transition-colors hover:bg-fond-neutre hover:text-texte-principal"
    >
      {children}
    </button>
  );
}
