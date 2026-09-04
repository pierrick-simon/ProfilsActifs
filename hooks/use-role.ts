"use client";

import { useSyncExternalStore } from "react";


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
