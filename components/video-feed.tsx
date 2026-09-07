"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  HeartIcon,
} from "@/components/icons";
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
  // Profils « likés » par l'utilisateur courant, et likes en cours d'envoi.
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());

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

  async function toggleLike(ownerId: string) {
    if (!ownerId || ownerId === userId || likingIds.has(ownerId)) {
      return;
    }

    const willLike = !likedIds.has(ownerId);

    setLikingIds((current) => new Set(current).add(ownerId));
    setLikedIds((current) => {
      const next = new Set(current);
      if (willLike) {
        next.add(ownerId);
      } else {
        next.delete(ownerId);
      }
      return next;
    });

    try {
      const response = await fetch(`/api/user/${ownerId}/like`, {
        method: willLike ? "POST" : "DELETE",
      });
      if (!response.ok) {
        throw new Error("like failed");
      }
    } catch {
      setLikedIds((current) => {
        const next = new Set(current);
        if (willLike) {
          next.delete(ownerId);
        } else {
          next.add(ownerId);
        }
        return next;
      });
      showError("Impossible d'enregistrer le like.", "Action échouée");
    } finally {
      setLikingIds((current) => {
        const next = new Set(current);
        next.delete(ownerId);
        return next;
      });
    }
  }

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

          {current && current.userId && current.userId !== userId && (
            <div className="absolute inset-y-0 right-4 flex flex-col justify-center items-center gap-5 text-texte-inverse">
              <FeedAction
                label=""
                ariaLabel={
                  likedIds.has(current.userId) ? "Je n'aime plus" : "J'aime"
                }
                onClick={() => toggleLike(current.userId)}
                disabled={likingIds.has(current.userId)}
              >
                <HeartIcon
                  className={`size-8 ${
                    likedIds.has(current.userId) ? "text-erreur" : ""
                  }`}
                  filled={likedIds.has(current.userId)}
                />
              </FeedAction>
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

type FeedActionProps = {
  label: string;
  ariaLabel: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

function FeedAction({
  label,
  ariaLabel,
  children,
  onClick,
  disabled,
}: FeedActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)] transition-transform enabled:hover:scale-110 disabled:opacity-70"
      aria-label={ariaLabel}
    >
      {children}
      <span className="font-sans text-[13px] font-medium">{label}</span>
    </button>
  );
}
