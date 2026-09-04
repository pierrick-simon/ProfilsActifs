"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth_client";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await authClient.signOut();
    // Réinitialise l'indicateur de rôle propre à l'interface.
    localStorage.removeItem("role");
    router.push("/connexion");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2 font-sans text-sm font-medium text-texte-secondaire shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)] transition-colors hover:bg-fond-neutre disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}
