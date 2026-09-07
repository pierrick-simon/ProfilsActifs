"use client";

import "./globals.css";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col bg-white font-sans text-neutral-900">
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
          <p className="text-sm text-neutral-500">
            Un problème inattendu a interrompu le chargement de la page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Réessayer
          </button>
        </main>
        <footer className="border-t border-neutral-200 px-4 py-3 text-center">
          <p className="text-xs text-neutral-500">
            Démonstrateur technique, ne constitue pas un service public en exploitation.
          </p>
        </footer>
      </body>
    </html>
  );
}
