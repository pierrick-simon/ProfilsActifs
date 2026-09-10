"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import {
  BanIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  EyeIcon,
  MapPinIcon,
  MoreIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { authClient } from "@/lib/auth_client";
import { useToast } from "@/components/toast";

export type ListedUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  createdAt: string | Date;
  localisation?: string | null;
};

export type ListedVideo = {
  userId?: string;
  url?: string | null;
  createdAt?: string;
  user?: { id?: string | null; localisation?: string | null } | null;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "candidat" | "recruteur";
  localisation: string;
  joinedAt: string;
  joinedOrder: number;
  hasVideo: boolean;
  videoUrl: string | null;
  isAdmin?: boolean;
  isBanned?: boolean;
};

type SortKey = "name" | "joined";
type SortDir = "asc" | "desc";

function cityOf(localisation?: string | null): string {
  if (!localisation || !localisation.trim()) {
    return "—";
  }
  return localisation.split(",")[0].trim() || "—";
}

function formatJoined(createdAt: string | Date): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function latestVideoByUser(videos: ListedVideo[]): Map<string, ListedVideo> {
  const latest = new Map<string, ListedVideo>();
  for (const video of videos) {
    const userId = video.userId ?? video.user?.id ?? null;
    if (!userId) {
      continue;
    }
    const previous = latest.get(userId);
    if (!previous) {
      latest.set(userId, video);
      continue;
    }
    const nextTime = new Date(video.createdAt ?? 0).getTime();
    const prevTime = new Date(previous.createdAt ?? 0).getTime();
    if (nextTime >= prevTime) {
      latest.set(userId, video);
    }
  }
  return latest;
}

function mapUsers(users: ListedUser[], videos: ListedVideo[]): AdminUser[] {
  const videosByUser = latestVideoByUser(videos);
  return users.map((user) => {
    const video = videosByUser.get(user.id);
    const created = new Date(user.createdAt);
    return {
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      role: user.role === "recruiter" ? "recruteur" : "candidat",
      localisation: cityOf(user.localisation || video?.user?.localisation),
      joinedAt: formatJoined(user.createdAt),
      joinedOrder: Number.isNaN(created.getTime()) ? 0 : created.getTime(),
      hasVideo: Boolean(video?.url),
      videoUrl: video?.url ?? null,
      isAdmin: user.role === "admin",
      isBanned: Boolean(user.banned),
    };
  });
}

export default function UserTable({
  users,
  videos,
  loading,
}: {
  users: ListedUser[];
  videos: ListedVideo[];
  loading: boolean;
}) {
  const { showError } = useToast();
  const [userList, setUserList] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "candidat" | "recruteur">(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [preview, setPreview] = useState<AdminUser | null>(null);
  const [moderating, setModerating] = useState<AdminUser | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    setUserList(mapUsers(users, videos));
  }, [users, videos]);

  async function toggleAdmin(id: string) {
    const user = userList.find((entry) => entry.id === id);
    if (!user || actingId) {
      return;
    }
    const nextAdmin = !user.isAdmin;
    setActingId(id);
    const { error } = await authClient.admin.setRole({
      userId: id,
      role: nextAdmin ? "admin" : "user",
    });
    setActingId(null);
    if (error) {
      showError(error.message ?? "Impossible de changer le rôle.");
      return;
    }
    setUserList((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, isAdmin: nextAdmin } : entry,
      ),
    );
  }

  async function toggleBan(id: string) {
    const user = userList.find((entry) => entry.id === id);
    if (!user || actingId) {
      return;
    }
    setActingId(id);
    if (user.isBanned) {
      const { error } = await authClient.admin.unbanUser({ userId: id });
      setActingId(null);
      if (error) {
        showError(error.message ?? "Impossible de réactiver l'utilisateur.");
        return;
      }
      setUserList((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, isBanned: false } : entry,
        ),
      );
      return;
    }
    const { error } = await authClient.admin.banUser({
      userId: id,
      banReason: "Banni par un administrateur",
    });
    setActingId(null);
    if (error) {
      showError(error.message ?? "Impossible de bannir l'utilisateur.");
      return;
    }
    setUserList((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, isBanned: true } : entry,
      ),
    );
  }

  // Le modal reste synchronisé avec la dernière version de l'utilisateur modéré.
  const moderatingUser = moderating
    ? (userList.find((user) => user.id === moderating.id) ?? null)
    : null;

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = userList.filter((user) => {
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
  }, [userList, query, roleFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="flex min-h-[500px] flex-col overflow-hidden rounded-2xl border border-bordure-defaut bg-fond-page shadow-sm">
      {/* Barre d'outils : filtre par rôle + recherche */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-bordure-defaut bg-fond-neutre/50 p-4 sm:flex-row sm:items-center md:p-5">
        <RoleFilter value={roleFilter} onChange={setRoleFilter} />

        <div className="relative w-full sm:w-72">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-texte-tertiaire">
            <SearchIcon className="size-4" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par nom ou e-mail..."
            className="w-full rounded-lg border border-bordure-defaut bg-fond-page py-2 pl-10 pr-4 font-sans text-sm text-texte-principal shadow-sm placeholder:text-texte-tertiaire focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[880px] text-left">
          <thead>
            <tr className="border-b border-bordure-defaut text-xs font-semibold uppercase tracking-wider text-texte-tertiaire">
              <SortHeader
                label="Utilisateur"
                active={sortKey === "name"}
                dir={sortDir}
                onClick={() => toggleSort("name")}
              />
              <th className="px-6 py-4">Rôle</th>
              <th className="px-6 py-4">Localisation</th>
              <SortHeader
                label="Inscription"
                active={sortKey === "joined"}
                dir={sortDir}
                onClick={() => toggleSort("joined")}
              />
              <th className="px-6 py-4 text-center">Vidéo</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bordure-defaut">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="bg-fond-neutre/40 px-6 py-12 text-center"
                >
                  <p className="font-sans text-sm text-texte-tertiaire">
                    Chargement des utilisateurs…
                  </p>
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((user) => (
                <tr
                  key={user.id}
                  className={`transition-colors hover:bg-fond-neutre/60 ${
                    user.isBanned ? "opacity-55" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full font-sans text-sm font-bold ${
                          user.role === "candidat"
                            ? "bg-fond-bleu-clair text-bleu-institutionnel"
                            : "bg-fond-neutre text-texte-secondaire"
                        }`}
                      >
                        {getInitials(user.name)}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-sans text-sm font-medium text-texte-principal">
                          {user.name}
                        </span>
                        <span className="font-sans text-sm text-texte-tertiaire">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <RoleBadge role={user.role} />
                      {user.isAdmin && <AdminBadge />}
                      {user.isBanned && <BannedBadge />}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-1.5 font-sans text-sm text-texte-secondaire">
                      <MapPinIcon className="size-4 text-texte-tertiaire" />
                      {user.localisation}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-sans text-sm text-texte-secondaire">
                    {user.joinedAt}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    {user.hasVideo ? (
                      <button
                        type="button"
                        onClick={() => setPreview(user)}
                        aria-label={`Voir la vidéo de ${user.name}`}
                        title="Voir la vidéo de présentation"
                        className="inline-flex size-8 items-center justify-center rounded-lg text-bleu-institutionnel transition-colors hover:bg-fond-bleu-clair"
                      >
                        <EyeIcon className="size-5" />
                      </button>
                    ) : (
                      <span className="font-sans font-medium text-texte-tertiaire">
                        —
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => setModerating(user)}
                      aria-label={`Modérer ${user.name}`}
                      title="Modérer l'utilisateur"
                      className="inline-flex size-8 items-center justify-center rounded-lg text-texte-tertiaire transition-colors hover:bg-fond-neutre hover:text-texte-secondaire"
                    >
                      <MoreIcon className="size-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="bg-fond-neutre/40 px-6 py-12 text-center"
                >
                  <SearchIcon className="mx-auto mb-2 size-7 text-texte-tertiaire" />
                  <p className="font-sans text-sm text-texte-tertiaire">
                    {userList.length === 0
                      ? "Aucun utilisateur inscrit."
                      : "Aucun utilisateur ne correspond à la recherche."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {preview && (
        <UserVideoModal user={preview} onClose={() => setPreview(null)} />
      )}

      {moderatingUser && (
        <ModerateUserModal
          user={moderatingUser}
          onClose={() => setModerating(null)}
          onToggleAdmin={() => toggleAdmin(moderatingUser.id)}
          onToggleBan={() => toggleBan(moderatingUser.id)}
        />
      )}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
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
    <div className="inline-flex w-full gap-1 rounded-lg border border-bordure-defaut bg-fond-neutre p-1 sm:w-auto">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={
              active
                ? "flex-1 rounded-md bg-fond-page px-4 py-1.5 font-sans text-xs font-semibold text-texte-principal shadow-sm ring-1 ring-black/5 sm:flex-none"
                : "flex-1 rounded-md px-4 py-1.5 font-sans text-xs font-semibold text-texte-tertiaire transition-colors hover:text-texte-secondaire sm:flex-none"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
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
    <th className="group cursor-pointer select-none px-6 py-4" onClick={onClick}>
      <div className="flex items-center gap-2">
        {label}
        {active ? (
          dir === "asc" ? (
            <ChevronUpIcon className="size-3.5 text-bleu-institutionnel" />
          ) : (
            <ChevronDownIcon className="size-3.5 text-bleu-institutionnel" />
          )
        ) : (
          <ChevronUpIcon className="size-3.5 opacity-0 transition-opacity group-hover:opacity-30" />
        )}
      </div>
    </th>
  );
}

function RoleBadge({ role }: { role: "candidat" | "recruteur" }) {
  if (role === "candidat") {
    return (
      <span className="inline-flex items-center rounded-full border border-bleu-institutionnel/15 bg-fond-bleu-clair px-2.5 py-0.5 font-sans text-xs font-semibold text-bleu-institutionnel">
        Candidat
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-bordure-defaut bg-fond-neutre px-2.5 py-0.5 font-sans text-xs font-semibold text-texte-secondaire">
      Recruteur
    </span>
  );
}

function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#5e1016] px-2.5 py-0.5 font-sans text-xs font-semibold text-texte-inverse">
      <ShieldCheckIcon className="size-3" />
      Admin
    </span>
  );
}

function BannedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-erreur/20 bg-erreur/10 px-2.5 py-0.5 font-sans text-xs font-semibold text-erreur">
      <BanIcon className="size-3" />
      Banni
    </span>
  );
}

function ModerateUserModal({
  user,
  onClose,
  onToggleAdmin,
  onToggleBan,
}: {
  user: AdminUser;
  onClose: () => void;
  onToggleAdmin: () => void;
  onToggleBan: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-texte-principal/40 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Modérer ${user.name}`}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-fond-page shadow-[0px_16px_32px_-12px_rgba(14,18,27,0.25)]"
      >
        {/* En-tête : identité de l'utilisateur */}
        <div className="flex items-start justify-between border-b border-bordure-defaut px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-full font-sans text-sm font-bold ${
                user.role === "candidat"
                  ? "bg-fond-bleu-clair text-bleu-institutionnel"
                  : "bg-fond-neutre text-texte-secondaire"
              }`}
            >
              {getInitials(user.name)}
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-base font-semibold text-texte-principal">
                {user.name}
              </span>
              <span className="font-sans text-sm text-texte-tertiaire">
                {user.email}
              </span>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <RoleBadge role={user.role} />
                {user.isAdmin && <AdminBadge />}
                {user.isBanned && <BannedBadge />}
              </div>
            </div>
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

        {/* Actions */}
        <div className="flex flex-col gap-2 p-4">
          <ModerationAction
            icon={<ShieldCheckIcon className="size-5" />}
            title={
              user.isAdmin
                ? "Retirer les droits d'administrateur"
                : "Nommer administrateur"
            }
            description={
              user.isAdmin
                ? "Rétablir un compte utilisateur standard."
                : "Donner accès à l'espace d'administration."
            }
            onClick={onToggleAdmin}
          />
          <ModerationAction
            variant="danger"
            icon={<BanIcon className="size-5" />}
            title={user.isBanned ? "Réactiver l'utilisateur" : "Bannir l'utilisateur"}
            description={
              user.isBanned
                ? "Restaurer l'accès à la plateforme."
                : "Bloquer l'accès de ce compte à la plateforme."
            }
            onClick={onToggleBan}
          />
        </div>
      </div>
    </div>
  );
}

function ModerationAction({
  icon,
  title,
  description,
  onClick,
  variant = "neutral",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "neutral" | "danger";
}) {
  const danger = variant === "danger";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border border-bordure-defaut p-3 text-left transition-colors ${
        danger ? "hover:border-erreur/30 hover:bg-erreur/5" : "hover:bg-fond-neutre"
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          danger
            ? "bg-erreur/10 text-erreur"
            : "bg-fond-bleu-clair text-bleu-institutionnel"
        }`}
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span
          className={`font-sans text-sm font-medium ${
            danger ? "text-erreur" : "text-texte-principal"
          }`}
        >
          {title}
        </span>
        <span className="font-sans text-xs text-texte-tertiaire">
          {description}
        </span>
      </span>
    </button>
  );
}

function UserVideoModal({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-texte-principal/80 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Vidéo de ${user.name}`}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-black shadow-2xl"
      >
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="text-texte-inverse">
            <h3 className="font-sans text-sm font-medium">{user.name}</h3>
            <p className="font-sans text-xs text-texte-inverse/70">
              Vidéo de présentation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full bg-black/20 p-2 text-texte-inverse/80 backdrop-blur-md transition-all hover:bg-black/40 hover:text-texte-inverse"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="relative aspect-[3/4] w-full bg-texte-principal">
          {user.videoUrl ? (
            <video
              src={user.videoUrl}
              controls
              autoPlay
              playsInline
              className="absolute inset-0 size-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-bleu-institutionnel/30 to-texte-principal px-6 text-center">
              <span className="font-sans text-sm font-medium text-texte-inverse/70">
                Aucune vidéo disponible.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
