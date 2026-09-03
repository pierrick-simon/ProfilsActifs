"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  HeartIcon,
} from "@/components/icons";
import { useRole } from "@/hooks/use-role";

const videoColors = [
  "bg-bleu-institutionnel",
  "bg-action-sur-blanc",
  "bg-texte-principal",
  "bg-texte-secondaire",
  "bg-bordure-forte",
];

export default function VideoFeed() {
  const isRecruteur = useRole() === "recruteur";
  const [index, setIndex] = useState(0);

  const goPrev = () =>
    setIndex((current) => (current - 1 + videoColors.length) % videoColors.length);
  const goNext = () => setIndex((current) => (current + 1) % videoColors.length);

  return (
    <div className="flex w-full items-center justify-center gap-4">
      {isRecruteur && (
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
        <div
          className={`relative aspect-[9/16] w-full overflow-hidden rounded-2xl transition-colors duration-500 ${videoColors[index]}`}
        >
          <div className="flex h-full items-center justify-center">
            <span className="font-sans text-sm font-medium text-texte-inverse/70">
              Vidéo {index + 1} / {videoColors.length}
            </span>
          </div>

          <div className="absolute inset-y-0 right-4 flex flex-col justify-center items-center gap-5 text-texte-inverse">
            <FeedAction label="" ariaLabel="J'aime">
              <HeartIcon className="size-8" filled />
            </FeedAction>
          </div>
        </div>
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
