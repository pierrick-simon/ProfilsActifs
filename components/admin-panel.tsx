"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth_client";
import { useToast } from "@/components/toast";
import { CheckIcon, CloseIcon } from "@/components/icons";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
};

type AdminVideo = {
  id: string;
  url: string;
  views: number;
  validated: boolean;
  userId: string;
  user: { id: string; name: string; email: string | null };
};

export default function AdminPanel() {
  const [tab, setTab] = useState<"users" | "videos">("users");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <h1 className="font-sans text-2xl font-medium text-texte-principal">Administration</h1>

      <div className="flex gap-2 border-b border-bordure-defaut">
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          Utilisateurs
        </TabButton>
        <TabButton active={tab === "videos"} onClick={() => setTab("videos")}>
          Vidéos à valider
        </TabButton>
      </div>

      {tab === "users" ? <UsersTab /> : <VideosTab />}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 font-sans text-sm font-medium transition-colors ${
        active
          ? "border-b-2 border-bleu-institutionnel text-bleu-institutionnel"
          : "text-texte-secondaire hover:text-texte-principal"
      }`}
    >
      {children}
    </button>
  );
}

function UsersTab() {
  const { showError } = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await authClient.admin.listUsers({
      query: {
        limit: 50,
        sortBy: "createdAt",
        sortDirection: "desc",
        ...(search ? { searchField: "email" as const, searchValue: search, searchOperator: "contains" as const } : {}),
      },
    });
    if (error) {
      showError(error.message ?? "Impossible de charger les utilisateurs.");
      return;
    }
    setUsers(data.users);
  }, [search, showError]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleAdmin(user: AdminUser) {
    const nextRole = user.role === "admin" ? "user" : "admin";
    const { error } = await authClient.admin.setRole({ userId: user.id, role: nextRole });
    if (error) {
      showError(error.message ?? "Impossible de changer le rôle.");
      return;
    }
    setUsers((prev) => prev?.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)) ?? null);
  }

  async function toggleBan(user: AdminUser) {
    if (user.banned) {
      const { error } = await authClient.admin.unbanUser({ userId: user.id });
      if (error) {
        showError(error.message ?? "Impossible de réactiver l'utilisateur.");
        return;
      }
      setUsers((prev) => prev?.map((u) => (u.id === user.id ? { ...u, banned: false } : u)) ?? null);
    } else {
      const { error } = await authClient.admin.banUser({
        userId: user.id,
        banReason: "Banni par un administrateur",
      });
      if (error) {
        showError(error.message ?? "Impossible de bannir l'utilisateur.");
        return;
      }
      setUsers((prev) => prev?.map((u) => (u.id === user.id ? { ...u, banned: true } : u)) ?? null);
    }
  }

  async function removeUser(user: AdminUser) {
    if (!confirm(`Supprimer définitivement le compte de ${user.email} ?`)) return;
    const { error } = await authClient.admin.removeUser({ userId: user.id });
    if (error) {
      showError(error.message ?? "Impossible de supprimer l'utilisateur.");
      return;
    }
    setUsers((prev) => prev?.filter((u) => u.id !== user.id) ?? null);
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher par e-mail…"
        className="w-full max-w-xs rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2 font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
      />

      {users === null ? (
        <p className="font-sans text-sm text-texte-secondaire">Chargement…</p>
      ) : users.length === 0 ? (
        <p className="font-sans text-sm text-texte-secondaire">Aucun utilisateur trouvé.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-bordure-defaut">
          <table className="w-full min-w-[640px] font-sans text-sm">
            <thead>
              <tr className="border-b border-bordure-defaut bg-fond-neutre text-left text-texte-secondaire">
                <th className="px-3 py-2 font-medium">Nom</th>
                <th className="px-3 py-2 font-medium">E-mail</th>
                <th className="px-3 py-2 font-medium">Rôle</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-bordure-defaut last:border-0">
                  <td className="px-3 py-2 text-texte-principal">{user.name}</td>
                  <td className="px-3 py-2 text-texte-secondaire">{user.email}</td>
                  <td className="px-3 py-2 text-texte-secondaire">{user.role ?? "user"}</td>
                  <td className="px-3 py-2">
                    {user.banned ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Banni
                      </span>
                    ) : (
                      <span className="rounded-full bg-fond-bleu-clair px-2 py-0.5 text-xs font-medium text-bleu-institutionnel">
                        Actif
                      </span>
                    )}
                  </td>
                  <td className="flex flex-wrap gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleAdmin(user)}
                      className="rounded-lg border border-bordure-defaut px-2 py-1 text-xs font-medium text-texte-secondaire transition-colors hover:bg-fond-neutre"
                    >
                      {user.role === "admin" ? "Retirer admin" : "Rendre admin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBan(user)}
                      className="rounded-lg border border-bordure-defaut px-2 py-1 text-xs font-medium text-texte-secondaire transition-colors hover:bg-fond-neutre"
                    >
                      {user.banned ? "Réactiver" : "Bannir"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeUser(user)}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VideosTab() {
  const { showError } = useToast();
  const [videos, setVideos] = useState<AdminVideo[] | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/videos?validated=false&limit=50");
    if (!response.ok) {
      showError("Impossible de charger les vidéos.");
      return;
    }
    const data = await response.json();
    setVideos(data.items);
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  async function setValidated(video: AdminVideo, validated: boolean) {
    const response = await fetch(`/api/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ validated }),
    });
    if (!response.ok) {
      showError("Action impossible.");
      return;
    }
    setVideos((prev) => prev?.filter((v) => v.id !== video.id) ?? null);
  }

  if (videos === null) {
    return <p className="font-sans text-sm text-texte-secondaire">Chargement…</p>;
  }
  if (videos.length === 0) {
    return <p className="font-sans text-sm text-texte-secondaire">Aucune vidéo en attente de validation.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <div key={video.id} className="flex flex-col gap-2 rounded-lg border border-bordure-defaut p-3">
          <video src={video.url} controls className="aspect-[9/16] w-full rounded-lg bg-black object-cover" />
          <div className="font-sans text-sm text-texte-principal">{video.user.name}</div>
          <div className="font-sans text-xs text-texte-tertiaire">{video.user.email}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValidated(video, true)}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-bleu-institutionnel px-2 py-1.5 text-xs font-medium text-texte-inverse transition hover:brightness-110"
            >
              <CheckIcon className="size-4" />
              Valider
            </button>
            <button
              type="button"
              onClick={() => setValidated(video, false)}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-bordure-defaut px-2 py-1.5 text-xs font-medium text-texte-secondaire transition-colors hover:bg-fond-neutre"
            >
              <CloseIcon className="size-4" />
              Rejeter
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
