"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BriefcaseIcon, CheckIcon, CloseIcon, PlusIcon } from "@/components/icons";
import { authClient } from "@/lib/auth_client";
import { useToast } from "@/components/toast";

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

const SECTOR_OPTIONS = Object.entries(SECTOR_LABELS);

type CatalogSkill = {
  id: string;
  name: string;
};

export default function ProfilCompetencesPage() {
  const router = useRouter();
  const { showError } = useToast();
  const { data: session } = authClient.useSession();
  const [sector, setSector] = useState("");
  const [catalog, setCatalog] = useState<CatalogSkill[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [initialSelected, setInitialSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const userId = session.user.id;
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [skillRes, mineRes, userRes] = await Promise.all([
          fetch("/api/skill"),
          fetch("/api/user/skill"),
          fetch(`/api/user/${userId}`),
        ]);
        if (!skillRes.ok || !mineRes.ok) {
          throw new Error("load failed");
        }
        const skillData = await skillRes.json();
        const mineData = await mineRes.json();
        const userData = userRes.ok ? await userRes.json() : null;
        const mine: CatalogSkill[] = Array.isArray(mineData.skills)
          ? mineData.skills
          : [];
        const mineIds = mine.map((item) => item.id);
        if (alive) {
          setCatalog(
            Array.isArray(skillData.skills) ? skillData.skills : [],
          );
          setSelected(mineIds);
          setInitialSelected(mineIds);
          if (
            typeof userData?.activity === "string" &&
            userData.activity in SECTOR_LABELS
          ) {
            setSector(userData.activity);
          }
        }
      } catch {
        if (alive) {
          showError(
            "Impossible de charger le secteur et les compétences.",
            "Profil incomplet",
          );
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
  }, [session?.user?.id, showError]);

  function toggleSkill(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleContinue() {
    if (submitting) {
      return;
    }
    if (!sector) {
      showError("Choisissez un secteur d'activité.");
      return;
    }

    setSubmitting(true);
    try {
      const activityRes = await fetch("/api/user/activity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_sector: sector }),
      });
      if (!activityRes.ok) {
        throw new Error("activity failed");
      }

      const toAdd = selected.filter((id) => !initialSelected.includes(id));
      const toRemove = initialSelected.filter((id) => !selected.includes(id));

      for (const skillId of toAdd) {
        const response = await fetch("/api/user/skill", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skill_id: skillId }),
        });
        if (!response.ok) {
          throw new Error("skill add failed");
        }
      }
      for (const skillId of toRemove) {
        const response = await fetch("/api/user/skill", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skill_id: skillId }),
        });
        if (!response.ok) {
          throw new Error("skill remove failed");
        }
      }

      router.push("/");
    } catch {
      showError(
        "Impossible d'enregistrer le secteur et les compétences.",
        "Enregistrement échoué",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-fond-page">
      <header className="flex items-center gap-6 border-b border-bordure-defaut px-11 py-6">
        <div className="flex flex-1 items-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-bleu-institutionnel font-sans text-sm font-medium text-texte-inverse">
            PA
          </span>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <Link
            href="/"
            aria-label="Fermer"
            className="rounded-[10px] p-2.5 text-texte-tertiaire transition-colors hover:bg-fond-neutre hover:text-texte-secondaire"
          >
            <CloseIcon className="size-5" />
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 justify-center px-6 py-8">
        <div className="flex h-full w-full max-w-[384px] flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-fond-neutre to-transparent p-4 outline outline-1 -outline-offset-1 outline-bordure-forte backdrop-blur">
              <span className="flex size-16 items-center justify-center rounded-full bg-fond-page text-bleu-institutionnel shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] outline outline-1 -outline-offset-1 outline-bordure-defaut">
                <BriefcaseIcon className="size-6" />
              </span>
            </span>
            <h1 className="font-sans text-2xl font-medium text-texte-principal">
              Secteur et compétences
            </h1>
            <p className="font-sans text-base text-texte-secondaire">
              Indiquez votre domaine et les compétences à mettre en avant.
            </p>
          </div>

          <div className="h-px w-full bg-bordure-defaut" />

          {loading ? (
            <p className="text-center font-sans text-sm text-texte-tertiaire">
              Chargement...
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="secteur"
                  className="font-sans text-sm font-medium text-texte-principal"
                >
                  Secteur d&apos;activité{" "}
                  <span className="text-bleu-institutionnel">*</span>
                </label>
                <select
                  id="secteur"
                  value={sector}
                  onChange={(event) => setSector(event.target.value)}
                  className="rounded-[10px] border border-bordure-defaut bg-fond-page px-3 py-2.5 font-sans text-sm text-texte-principal shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
                >
                  <option value="">Choisir un secteur</option>
                  {SECTOR_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <span className="font-sans text-sm font-medium text-texte-principal">
                  Compétences
                </span>
                {catalog.length === 0 ? (
                  <p className="font-sans text-sm text-texte-tertiaire">
                    Aucune compétence disponible pour le moment.
                  </p>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
                    {catalog.map((skill) => {
                      const isSelected = selected.includes(skill.id);
                      return (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => toggleSkill(skill.id)}
                          className={`flex items-center gap-3.5 rounded-xl p-4 text-left transition-colors ${
                            isSelected
                              ? "border border-bleu-institutionnel bg-fond-page"
                              : "border border-bordure-defaut bg-fond-page shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] hover:bg-fond-neutre"
                          }`}
                        >
                          <span className="min-w-0 flex-1 font-sans text-sm font-medium text-texte-principal">
                            {skill.name}
                          </span>
                          <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                              isSelected
                                ? "border-bleu-institutionnel bg-bleu-institutionnel"
                                : "border-bordure-forte bg-fond-page"
                            }`}
                          >
                            {isSelected ? (
                              <CheckIcon className="size-3 text-texte-inverse" />
                            ) : (
                              <PlusIcon className="size-3 text-texte-tertiaire" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={submitting || !sector}
                className="flex w-full items-center justify-center gap-1 overflow-hidden rounded-[10px] bg-bleu-institutionnel bg-[linear-gradient(180deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%)] p-2.5 shadow-[0px_0px_0px_1px_var(--color-bleu-institutionnel),0px_1px_2px_0px_rgba(14,18,27,0.24)] outline outline-1 -outline-offset-1 outline-white/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
              >
                <span className="px-1 font-sans text-sm font-medium leading-5 text-texte-inverse">
                  {submitting ? "Enregistrement..." : "Continuer"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
