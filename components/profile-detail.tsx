"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BriefcaseIcon,
  ChevronLeftIcon,
  ClockIcon,
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

type ProfileData = {
  user: {
    id: string;
    name: string;
    image: string | null;
    role: string | null;
    location: string | null;
    age: number;
  };
  video: { url: string | null; views: number; createdAt: string } | null;
  skills: string[];
  responses: { question: string; answer: string }[];
};

function formatViews(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(count);
}

function formatRelative(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) {
    const hours = Math.floor(diff / 3_600_000);
    if (hours <= 0) {
      return "à l'instant";
    }
    return `il y a ${hours} h`;
  }
  if (days === 1) {
    return "il y a 1 jour";
  }
  return `il y a ${days} jours`;
}

export default function ProfileDetail({ userId }: { userId: string }) {
  const isRecruteur = useRole() === "recruteur";
  const { showError } = useToast();
  const { data: session } = authClient.useSession();
  const viewerId = session?.user?.id ?? null;

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/profiles/${userId}`);
        if (!response.ok) {
          throw new Error("profile unavailable");
        }
        const payload = (await response.json()) as ProfileData;
        if (alive) {
          setData(payload);
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
        {loading || !data ? (
          <DetailSkeleton />
        ) : (
          <>
            <div className="flex flex-1 flex-col lg:w-2/3">
              <div className="relative mx-auto aspect-[9/16] w-full max-w-md overflow-hidden rounded-2xl bg-texte-principal shadow-lg">
                {data.video?.url ? (
                  <video
                    src={data.video.url}
                    poster={data.user.image ?? undefined}
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
                    <EyeIcon className="size-4" />{" "}
                    {formatViews(data.video?.views ?? 0)} vues
                  </span>
                  {data.video && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="size-4" /> Ajouté{" "}
                      {formatRelative(data.video.createdAt)}
                    </span>
                  )}
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
                      {data.user.name}
                    </h1>
                    {data.user.role && (
                      <p className="mt-1 font-sans text-lg font-medium text-bleu-institutionnel">
                        {SECTOR_LABELS[data.user.role] ?? data.user.role}
                      </p>
                    )}
                  </div>
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-fond-page bg-fond-bleu-clair font-sans text-lg font-medium text-bleu-institutionnel shadow-md">
                    {data.user.image ? (
                      <Image
                        src={data.user.image}
                        alt={data.user.name}
                        width={64}
                        height={64}
                        className="size-full object-cover"
                      />
                    ) : (
                      data.user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-3">
                  {data.user.location && (
                    <span className="flex items-center gap-1.5 rounded-lg border border-bordure-defaut bg-fond-neutre px-3 py-1.5 font-sans text-sm text-texte-secondaire">
                      <MapPinIcon className="size-4 text-texte-tertiaire" />{" "}
                      {data.user.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 rounded-lg border border-bordure-defaut bg-fond-neutre px-3 py-1.5 font-sans text-sm text-texte-secondaire">
                    <BriefcaseIcon className="size-4 text-texte-tertiaire" />{" "}
                    {data.user.age} ans
                  </span>
                </div>

                {data.skills.length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-texte-principal">
                        Compétences
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md border border-bleu-institutionnel/15 bg-fond-bleu-clair px-2.5 py-1 font-sans text-xs font-semibold text-bleu-institutionnel"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {canContact && (
                  <div className="mt-8 flex gap-3">
                    <Link
                      href={`/messages/${data.user.id}?name=${encodeURIComponent(data.user.name)}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-bleu-institutionnel px-4 py-2.5 font-sans text-sm font-medium text-texte-inverse transition-colors hover:brightness-110"
                    >
                      <MailIcon className="size-4" />
                      Contacter
                    </Link>
                  </div>
                )}
              </div>

              {data.responses.length > 0 && (
                <div className="rounded-2xl border border-bordure-defaut bg-fond-page p-6 shadow-sm">
                  <h3 className="mb-4 font-sans text-base font-bold text-texte-principal">
                    Réponses au questionnaire
                  </h3>
                  <div className="space-y-4">
                    {data.responses.map((item, index) => (
                      <div
                        key={item.question}
                        className={`relative pl-6 before:absolute before:left-2 before:top-2 before:w-0.5 before:bg-bordure-defaut ${
                          index === data.responses.length - 1
                            ? "before:hidden"
                            : "before:bottom-[-1rem]"
                        }`}
                      >
                        <div
                          className={`absolute left-1 top-1.5 size-2.5 rounded-full border-2 border-fond-page ${
                            index === 0 ? "bg-bleu-institutionnel" : "bg-bordure-forte"
                          }`}
                        />
                        <h4 className="font-sans text-sm font-semibold text-texte-principal">
                          {item.question}
                        </h4>
                        <p className="font-sans text-xs text-texte-secondaire">
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
        <div className="h-40 animate-pulse rounded-2xl bg-bordure-defaut" />
      </div>
    </>
  );
}
