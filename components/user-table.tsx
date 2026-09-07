"use client";

import { useMemo, useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  EyeIcon,
  PlayIcon,
  SearchIcon,
} from "@/components/icons";


type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "candidat" | "recruteur";
  localisation: string;
  joinedAt: string;
  joinedOrder: number;
  hasVideo: boolean;
};

const users: AdminUser[] = [
  {
    id: "1",
    name: "Amina Koné",
    email: "amina.kone@exemple.fr",
    role: "candidat",
    localisation: "Paris",
    joinedAt: "15 juil. 2023",
    joinedOrder: 1,
    hasVideo: true,
  },
  {
    id: "2",
    name: "Lucas Martin",
    email: "lucas.martin@exemple.fr",
    role: "candidat",
    localisation: "Lyon",
    joinedAt: "17 juil. 2023",
    joinedOrder: 2,
    hasVideo: true,
  },
  {
    id: "3",
    name: "Sophia Nguyen",
    email: "sophia.nguyen@exemple.fr",
    role: "recruteur",
    localisation: "Nantes",
    joinedAt: "19 juil. 2023",
    joinedOrder: 3,
    hasVideo: false,
  },
  {
    id: "4",
    name: "Youssef Benali",
    email: "youssef.benali@exemple.fr",
    role: "candidat",
    localisation: "Marseille",
    joinedAt: "21 juil. 2023",
    joinedOrder: 4,
    hasVideo: true,
  },
  {
    id: "5",
    name: "Emma Dubois",
    email: "emma.dubois@exemple.fr",
    role: "recruteur",
    localisation: "Lille",
    joinedAt: "23 juil. 2023",
    joinedOrder: 5,
    hasVideo: false,
  },
  {
    id: "6",
    name: "Noah Garcia",
    email: "noah.garcia@exemple.fr",
    role: "candidat",
    localisation: "Bordeaux",
    joinedAt: "25 juil. 2023",
    joinedOrder: 6,
    hasVideo: true,
  },
  {
    id: "7",
    name: "Léa Rousseau",
    email: "lea.rousseau@exemple.fr",
    role: "candidat",
    localisation: "Toulouse",
    joinedAt: "27 juil. 2023",
    joinedOrder: 7,
    hasVideo: false,
  },
];

const avatarColors = [
  "bg-fond-bleu-clair text-bleu-institutionnel",
  "bg-amber-50 text-amber-600",
  "bg-emerald-50 text-emerald-600",
  "bg-rose-50 text-rose-600",
  "bg-violet-50 text-violet-600",
  "bg-sky-50 text-sky-600",
];

type SortKey = "name" | "joined";
type SortDir = "asc" | "desc";

export default function UserTable() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "candidat" | "recruteur">(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  // Utilisateur dont on regarde la vidéo (null = popup fermé).
  const [preview, setPreview] = useState<AdminUser | null>(null);

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);
      return matchesRole && matchesSearch;
    });

    const sorted = [...filtered].sort((a, b) => {
      const value =
        sortKey === "name"
          ? a.name.localeCompare(b.name)
          : a.joinedOrder - b.joinedOrder;
      return sortDir === "asc" ? value : -value;
    });

    return sorted;
  }, [query, roleFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <RoleFilter value={roleFilter} onChange={setRoleFilter} />

        <div className="flex items-center gap-2 rounded-[10px] border border-bordure-defaut bg-fond-page px-3 py-2 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus-within:border-bleu-institutionnel focus-within:ring-2 focus-within:ring-fond-bleu-clair sm:w-72">
          <SearchIcon className="size-4 shrink-0 text-texte-tertiaire" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full bg-transparent font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-bordure-defaut">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-bordure-defaut bg-fond-neutre/50">
              <SortHeader
                label="Utilisateur"
                active={sortKey === "name"}
                dir={sortDir}
                onClick={() => toggleSort("name")}
              />
              <HeaderCell>Rôle</HeaderCell>
              <HeaderCell>Localisation</HeaderCell>
              <SortHeader
                label="Inscription"
                active={sortKey === "joined"}
                dir={sortDir}
                onClick={() => toggleSort("joined")}
              />
              <HeaderCell>Vidéo</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {rows.map((user, index) => (
              <tr
                key={user.id}
                className="border-b border-bordure-defaut last:border-b-0 transition-colors hover:bg-fond-neutre/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full font-sans text-sm font-medium ${
                        avatarColors[index % avatarColors.length]
                      }`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-sans text-sm font-medium text-texte-principal">
                        {user.name}
                      </span>
                      <span className="font-sans text-xs text-texte-tertiaire">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3 font-sans text-sm text-texte-secondaire">
                  {user.localisation}
                </td>
                <td className="px-4 py-3 font-sans text-sm text-texte-secondaire">
                  {user.joinedAt}
                </td>
                <td className="px-4 py-3">
                  {user.hasVideo ? (
                    <button
                      type="button"
                      onClick={() => setPreview(user)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-bordure-defaut bg-fond-page px-2.5 py-1.5 font-sans text-sm font-medium text-texte-secondaire transition-colors hover:bg-fond-neutre"
                    >
                      <EyeIcon className="size-4" />
                      Voir
                    </button>
                  ) : (
                    <span className="font-sans text-sm text-texte-tertiaire">
                      —
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center font-sans text-sm text-texte-tertiaire"
                >
                  Aucun utilisateur ne correspond à la recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {preview && (
        <UserVideoModal user={preview} onClose={() => setPreview(null)} />
      )}
    </section>
  );
}

function RoleFilter({
  value,
  onChange,
}: {
  value: "all" | "candidat" | "recruteur";
  onChange: (value: "all" | "candidat" | "recruteur") => void;
}) {
  const options: { id: "all" | "candidat" | "recruteur"; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "candidat", label: "Candidats" },
    { id: "recruteur", label: "Recruteurs" },
  ];

  return (
    <div className="flex w-full gap-1 rounded-[10px] bg-fond-neutre p-1 sm:w-80">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={
              active
                ? "flex flex-1 items-center justify-center rounded-md bg-fond-page px-2 py-1.5 font-sans text-sm font-medium text-texte-principal shadow-[0_2px_4px_0_rgba(14,18,27,0.06)]"
                : "flex flex-1 items-center justify-center rounded-md px-2 py-1.5 font-sans text-sm font-medium text-texte-tertiaire transition-colors hover:text-texte-secondaire"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left font-sans text-sm font-medium text-texte-secondaire">
      {children}
    </th>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 font-sans text-sm font-medium text-texte-secondaire transition-colors hover:text-texte-principal"
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ChevronUpIcon className="size-4" />
          ) : (
            <ChevronDownIcon className="size-4" />
          )
        ) : (
          <ChevronDownIcon className="size-4 text-texte-tertiaire" />
        )}
      </button>
    </th>
  );
}

function RoleBadge({ role }: { role: "candidat" | "recruteur" }) {
  if (role === "candidat") {
    return (
      <span className="inline-flex rounded-full bg-fond-bleu-clair px-2.5 py-1 font-sans text-xs font-medium text-bleu-institutionnel">
        Candidat
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-fond-neutre px-2.5 py-1 font-sans text-xs font-medium text-texte-secondaire">
      Recruteur
    </span>
  );
}

// Popup d'aperçu de la vidéo d'un utilisateur. Placeholder pour l'instant : la
// source réelle sera branchée quand l'API renverra l'URL de la vidéo.
function UserVideoModal({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-texte-principal/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Vidéo de ${user.name}`}
        className="relative z-10 flex w-full max-w-[360px] flex-col overflow-hidden rounded-2xl bg-fond-page shadow-[0px_16px_32px_-12px_rgba(14,18,27,0.25)]"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="font-sans text-sm font-medium text-texte-principal">
              {user.name}
            </span>
            <span className="font-sans text-xs text-texte-tertiaire">
              Vidéo de présentation
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1 text-texte-tertiaire transition-colors hover:bg-fond-neutre hover:text-texte-secondaire"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="flex aspect-[3/4] items-center justify-center bg-texte-principal">
          <PlayIcon className="size-12 text-texte-inverse/70" />
        </div>
      </div>
    </div>
  );
}
