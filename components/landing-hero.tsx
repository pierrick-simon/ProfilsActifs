import Link from "next/link";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons";

const features = [
  "Profils vidéo certifiés",
  "Mise en relation directe",
  "Accompagnement personnalisé",
];

export default function LandingHero() {
  return (
    <div className="flex w-full flex-col items-center bg-fond-page pb-10">

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pt-10 lg:px-12">
        <div className="flex flex-col items-center gap-7 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-3">
              <span className="flex items-center gap-2 rounded-[10px] bg-fond-neutre py-1 pl-1.5 pr-2.5">
                <span className="rounded-[5px] bg-fond-page px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide text-bleu-institutionnel shadow-[0px_1px_1px_-0.5px_rgba(20,33,61,0.06),0px_3px_3px_-1.5px_rgba(20,33,61,0.04)]">
                  Nouveau
                </span>
                <span className="font-sans text-sm font-medium text-texte-secondaire">
                  Ouvert à tous les profils
                </span>
                <ChevronRightIcon className="size-4 text-bleu-institutionnel" />
              </span>

              <h1 className="max-w-3xl font-sans text-4xl font-semibold leading-tight tracking-tight text-texte-principal sm:text-5xl lg:text-[56px]">
                Tous vos talents, une seule plateforme.
              </h1>
            </div>

            <p className="max-w-2xl font-sans text-base leading-relaxed text-texte-secondaire">
              Présentez-vous en vidéo, valorisez votre parcours et laissez les
              recruteurs vous repérer, le tout au même endroit.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/inscription"
              className="flex items-center justify-center gap-1 overflow-hidden rounded-xl bg-bleu-institutionnel bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%)] px-4 py-2.5 shadow-[0px_0px_0px_1px_var(--color-bleu-institutionnel),0px_1px_2px_0px_rgba(14,18,27,0.24)] outline outline-1 -outline-offset-1 outline-white/10 transition hover:brightness-110"
            >
              <span className="px-1 font-sans text-sm font-medium text-texte-inverse">
                Créer mon profil
              </span>
              <ChevronRightIcon className="size-5 text-texte-inverse/60" />
            </Link>

            <Link
              href="/connexion"
              className="flex items-center justify-center gap-1 rounded-xl bg-fond-neutre px-4 py-2.5 font-sans text-sm font-medium text-texte-secondaire transition-colors hover:bg-fond-neutre/70"
            >
              <ChevronLeftIcon className="size-5" />
              <span className="px-1">Se connecter</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <ul className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <span className="flex size-4 items-center justify-center rounded-full bg-bleu-institutionnel">
                  <CheckIcon className="size-2.5 text-texte-inverse" />
                </span>
                <span className="font-sans text-base font-medium text-texte-secondaire">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex w-full flex-col items-center gap-8 rounded-3xl bg-gradient-to-b from-fond-neutre to-fond-page px-4 py-10 sm:px-10 lg:px-16">
            <ProductPreview />

          </div>
        </div>
      </div>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="w-full max-w-4xl rounded-[32px] border border-bordure-defaut bg-fond-page p-2.5 shadow-[0px_10px_20px_-10px_rgba(20,33,61,0.12),0px_20px_40px_-20px_rgba(20,33,61,0.1)]">
      <div className="rounded-3xl bg-fond-neutre p-2.5">
        <div className="overflow-hidden rounded-2xl bg-fond-page shadow-[0px_1px_2px_0px_rgba(20,33,61,0.06)]">
          <div className="flex items-center gap-2 border-b border-bordure-defaut px-4 py-3">
            <span className="size-2.5 rounded-full bg-bordure-forte/50" />
            <span className="size-2.5 rounded-full bg-bordure-forte/50" />
            <span className="size-2.5 rounded-full bg-bordure-forte/50" />
            <span className="ml-3 rounded-full bg-fond-neutre px-3 py-1 font-sans text-xs text-texte-tertiaire">
              compétences+.fr
            </span>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-[3fr_2fr]">
            <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-bleu-institutionnel to-texte-principal">
              <span className="font-sans text-sm font-medium text-texte-inverse/70">
                Profil vidéo
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="h-3 w-2/3 rounded-full bg-fond-neutre" />
              <div className="h-3 w-full rounded-full bg-fond-neutre" />
              <div className="h-3 w-5/6 rounded-full bg-fond-neutre" />
              <div className="mt-2 h-9 w-full rounded-lg bg-fond-bleu-clair" />
              <div className="h-9 w-full rounded-lg bg-fond-neutre" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
