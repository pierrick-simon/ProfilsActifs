import Image from "next/image";
import SegmentedControl from "@/components/segmented-control";

export default function ProfileSpotlight() {
  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-xl border border-bordure-defaut bg-fond-page p-6">
      <SegmentedControl
        options={["Aperçu"]}
        activeIndex={0}
      />

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-sans text-lg font-medium text-texte-principal">Amina K.</p>
        <p className="font-sans text-sm text-texte-secondaire">
          Développeuse back-end · Lyon
        </p>
      </div>

      <CertificationMedal />

      <p className="font-sans text-sm text-texte-secondaire">
        Profil certifié mis en avant ce mois-ci.
      </p>
    </section>
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
        className="absolute flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#122368] bg-fond-page"
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
