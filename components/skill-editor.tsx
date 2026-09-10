"use client";

import { useEffect, useState } from "react";
import { BriefcaseIcon, CloseIcon, PlusIcon } from "@/components/icons";
import { useToast } from "@/components/toast";

type CatalogSkill = {
  id: string;
  name: string;
};

function parseSkills(raw: unknown): CatalogSkill[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.name !== "string") {
      return [];
    }
    return [{ id: row.id, name: row.name }];
  });
}

export default function SkillEditor() {
  const { showError } = useToast();
  const [skills, setSkills] = useState<CatalogSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/skill");
        if (!response.ok) {
          throw new Error("skills unavailable");
        }
        const data = await response.json();
        if (alive) {
          setSkills(parseSkills(data.skills));
        }
      } catch {
        if (alive) {
          showError(
            "Impossible de charger les compétences.",
            "Compétences",
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
  }, [showError]);

  async function addSkill() {
    const trimmed = name.trim();
    if (!trimmed || adding) {
      return;
    }
    setAdding(true);
    try {
      const response = await fetch("/api/skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 409) {
        showError("Cette compétence existe déjà.", "Compétences");
        return;
      }
      if (!response.ok) {
        throw new Error(data?.error ?? "create failed");
      }
      const created: CatalogSkill = {
        id: typeof data?.id === "string" ? data.id : trimmed,
        name: typeof data?.name === "string" ? data.name : trimmed,
      };
      setSkills((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name, "fr")),
      );
      setName("");
    } catch {
      showError("Impossible d'ajouter cette compétence.", "Compétences");
    } finally {
      setAdding(false);
    }
  }

  async function removeSkill(skill: CatalogSkill) {
    if (removingId) {
      return;
    }
    const confirmed = window.confirm(
      `Supprimer la compétence « ${skill.name} » ? Elle sera retirée de tous les profils.`,
    );
    if (!confirmed) {
      return;
    }
    setRemovingId(skill.id);
    try {
      const response = await fetch(`/api/skill/${skill.id}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 404) {
        throw new Error("delete failed");
      }
      setSkills((current) => current.filter((item) => item.id !== skill.id));
    } catch {
      showError("Impossible de supprimer cette compétence.", "Compétences");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-sans text-lg font-bold text-texte-principal">
            Liste des compétences
          </h3>
          <p className="font-sans text-sm text-texte-tertiaire">
            {loading
              ? "Chargement..."
              : `${skills.length} compétence${skills.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <form
          className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            addSkill();
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nouvelle compétence"
            aria-label="Nom de la compétence"
            className="min-w-0 flex-1 rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire shadow-sm focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
          />
          <button
            type="submit"
            disabled={adding || name.trim() === ""}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-bleu-institutionnel px-4 py-2.5 font-sans text-sm font-medium text-texte-inverse shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="size-4" />
            {adding ? "Ajout..." : "Ajouter"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-xl bg-fond-page"
            />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-bordure-forte bg-fond-page p-12 text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-fond-neutre text-texte-tertiaire">
            <BriefcaseIcon className="size-7" />
          </span>
          <h4 className="mb-1 font-sans text-base font-semibold text-texte-principal">
            Aucune compétence
          </h4>
          <p className="font-sans text-sm text-texte-tertiaire">
            Ajoutez une compétence pour qu&apos;elle apparaisse sur les profils.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-2xl border border-bordure-defaut bg-fond-page shadow-sm">
          {skills.map((skill, index) => (
            <li
              key={skill.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                index > 0 ? "border-t border-bordure-defaut" : ""
              }`}
            >
              <span className="min-w-0 flex-1 font-sans text-sm font-medium text-texte-principal">
                {skill.name}
              </span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                disabled={removingId === skill.id}
                aria-label={`Supprimer ${skill.name}`}
                title="Supprimer"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-bordure-defaut text-texte-secondaire transition-colors hover:border-erreur/30 hover:bg-erreur/10 hover:text-erreur disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CloseIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
