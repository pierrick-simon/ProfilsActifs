"use client";

import Image from "next/image";
import Link from "next/link";
import SegmentedControl from "@/components/segmented-control";
import { useRole } from "@/hooks/use-role";
import { useCurrentProfile } from "@/components/current-profile";

export default function ProfileSpotlight() {
  const role = useRole();
  const isRecruteur = role === "recruteur";
  const isCandidat = role === "candidat";
  const { profile } = useCurrentProfile();
  const displayName = profile?.name?.trim() || "Aucun profil";

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-xl border border-bordure-defaut bg-fond-page p-6">
      <SegmentedControl
        options={["Aperçu"]}
        activeIndex={0}
      />

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-sans text-lg font-medium text-texte-principal">
          {displayName}
        </p>
        <p className="font-sans text-sm text-texte-secondaire">
          Développeuse back-end · Lyon
        </p>
      </div>

      <CertificationMedal />

      <p className="font-sans text-sm text-texte-secondaire">
        Profil certifié mis en avant ce mois-ci.
      </p>

      {isRecruteur && (
        <Link
          href={
            profile?.userId
              ? `/messages/${profile.userId}?name=${encodeURIComponent(profile.name)}`
              : "/messages"
          }
          className="flex w-full items-center justify-center gap-1 overflow-hidden rounded-lg bg-fond-page p-2 shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)] outline outline-1 -outline-offset-1 outline-bordure-defaut transition-colors hover:bg-fond-neutre"
        >
          <span className="px-1 font-sans text-sm font-medium leading-5 text-texte-secondaire">
            Contact
          </span>
        </Link>
      )}

      {isCandidat && (
        <div className="flex w-full flex-col gap-4">
          <SegmentedControl options={["Mes statistiques"]} activeIndex={0} />
          <div className="flex w-full flex-col gap-4">
            <Statistic label="Vues" value="3 484" delta="+7,1 %" />
            <Statistic label="J'aime" value="1 209" delta="+4,3 %" />
          </div>
        </div>
      )}
    </section>
  );
}

function Statistic({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="flex w-full flex-col gap-1 text-left">
      <span className="font-sans text-sm text-texte-secondaire">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="font-sans text-3xl font-semibold text-texte-principal">
          {value}
        </span>
        <span className="font-sans text-sm font-medium text-emerald-600">
          {delta}
        </span>
        <span className="font-sans text-sm text-texte-tertiaire">vs préc.</span>
      </div>
    </div>
  );
}

// Médaille de certification importée de la maquette Figma : grille de fond,
// fanions, étoile crantée et portrait au centre.
function CertificationMedal() {
  const centered: React.CSSProperties = {
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
  };

  return (
    <div
      className="relative flex h-[156px] w-full items-center justify-center overflow-hidden"
      role="img"
      aria-label="Badge de certification"
    >
      <Image
        src="/certification/pattern.svg"
        alt=""
        aria-hidden
        width={320}
        height={156}
        className="pointer-events-none absolute max-w-none"
        style={centered}
      />
      <Image
        src="/certification/left-flag.svg"
        alt=""
        aria-hidden
        width={56}
        height={32}
        className="pointer-events-none absolute"
        style={{ left: "calc(50% - 80px)", top: "calc(50% - 4px)", transform: "translate(-50%, -50%)" }}
      />
      <Image
        src="/certification/right-flag.svg"
        alt=""
        aria-hidden
        width={56}
        height={32}
        className="pointer-events-none absolute"
        style={{ left: "calc(50% + 80px)", top: "calc(50% - 4px)", transform: "translate(-50%, -50%) scaleX(-1)" }}
      />
      <Image
        src="/certification/outer-star.svg"
        alt=""
        aria-hidden
        width={144}
        height={144}
        className="pointer-events-none absolute"
        style={centered}
      />
      <Image
        src="/certification/inner-star.svg"
        alt=""
        aria-hidden
        width={132}
        height={132}
        className="pointer-events-none absolute"
        style={centered}
      />
      <div
        className="absolute flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#5e1016] bg-fond-page"
        style={centered}
      >
        <div className="size-[72px] overflow-hidden rounded-full bg-fond-bleu-clair">
          <Image
            src="/certification/avatar.png"
            alt="Portrait du profil certifié"
            width={72}
            height={72}
            className="size-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
