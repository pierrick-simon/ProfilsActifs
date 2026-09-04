"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AlertFillIcon, CloseIcon } from "@/components/icons";

type Toast = {
  id: number;
  title: string;
  description: string;
};

type ToastContextValue = {
  showError: (description: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast doit être utilisé dans un ToastProvider.");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showError = useCallback((description: string, title = "Erreur") => {
    setToasts((current) => [
      ...current,
      { id: Date.now() + Math.random(), title, description },
    ]);
  }, []);

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-3 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map((toast) => (
          <ErrorToast
            key={toast.id}
            title={toast.title}
            description={toast.description}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ErrorToast({
  title,
  description,
  onDismiss,
}: {
  title: string;
  description: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timeout = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div
      role="alert"
      className="pointer-events-auto flex w-[390px] max-w-[calc(100vw-2rem)] gap-3 rounded-xl bg-erreur px-3.5 pb-4 pt-3.5 text-texte-inverse shadow-[0_8px_24px_-6px_rgba(251,55,72,0.5)]"
    >
      <AlertFillIcon className="size-5 shrink-0" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-sans text-sm font-medium leading-snug">{title}</p>
        <p className="font-sans text-sm leading-snug text-texte-inverse/90">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer"
        className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
      >
        <CloseIcon className="size-5" />
      </button>
    </div>
  );
}
