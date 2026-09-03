"use client";

import { useSyncExternalStore } from "react";

// Le rôle est stocké dans localStorage à l'inscription. On l'expose via
// useSyncExternalStore : lecture synchrone côté client, valeur nulle côté
// serveur, et mise à jour si un autre onglet modifie le stockage.
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useRole(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => localStorage.getItem("role"),
    () => null,
  );
}
