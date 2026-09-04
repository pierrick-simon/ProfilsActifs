"use client";

import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  HeartIcon,
} from "@/components/icons";
import { useRole } from "@/hooks/use-role";
import { useToast } from "@/components/toast";

type FeedVideo = {
  id: string;
  video_url: string;
  user_id: string;
};

export default function VideoFeed() {
  const isRecruteur = useRole() === "recruteur";
  const { showError } = useToast();
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/feed?limit=20");
        if (!response.ok) {
          throw new Error("feed unavailable");
        }
        const data = await response.json();
        if (active) {
          setVideos(Array.isArray(data.videos) ? data.videos : []);
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
  }, [showError]);

  const hasVideos = videos.length > 0;
  const current = hasVideos ? videos[index] : null;

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

      <div className="flex w-full max-w-[420px] flex-col items-center gap-3">
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-texte-principal">
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
            <div className="flex h-full items-center justify-center px-6 text-center">
              <span className="font-sans text-sm font-medium text-texte-inverse/70">
                {loading
                  ? "Chargement des vidéos..."
                  : "Aucune vidéo pour le moment."}
              </span>
            </div>
          )}

          {current && (
            <div className="absolute inset-y-0 right-4 flex flex-col justify-center items-center gap-5 text-texte-inverse">
              <FeedAction label="" ariaLabel="J'aime">
                <HeartIcon className="size-8" filled />
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
};

function FeedAction({ label, ariaLabel, children }: FeedActionProps) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]"
      aria-label={ariaLabel}
    >
      {children}
      <span className="font-sans text-[13px] font-medium">{label}</span>
    </button>
  );
}
