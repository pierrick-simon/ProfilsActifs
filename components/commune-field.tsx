"use client";

import { useEffect, useId, useState } from "react";
import { MapPinIcon } from "@/components/icons";
import { searchCommunes, type CommuneSuggestion } from "@/lib/geo-gouv";

export default function CommuneField({
  value,
  picked,
  onChange,
  required = false,
}: {
  value: string;
  picked: boolean;
  onChange: (value: string, picked: boolean) => void;
  required?: boolean;
}) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<CommuneSuggestion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (picked || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const list = await searchCommunes(query, controller.signal);
        setSuggestions(list);
        setOpen(list.length > 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setSuggestions([]);
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, picked]);

  function pick(suggestion: CommuneSuggestion) {
    onChange(suggestion.label, true);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="relative flex flex-col gap-1">
      <label htmlFor="adresse" className="font-sans text-sm font-medium text-texte-principal">
        Localisation <span className="text-bleu-institutionnel">*</span>
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] focus-within:border-bleu-institutionnel focus-within:ring-2 focus-within:ring-fond-bleu-clair">
        <MapPinIcon className="size-5 shrink-0 text-texte-tertiaire" />
        <input
          id="adresse"
          type="text"
          required={required}
          value={value}
          onChange={(event) => {
            onChange(event.target.value, false);
            setOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          placeholder="Ville ou code postal"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          className="flex-1 bg-transparent font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:outline-none"
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-bordure-defaut bg-fond-page py-1 shadow-[0px_16px_32px_-12px_rgba(14,18,27,0.12)]"
        >
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.code}-${suggestion.codePostal}`}>
              <button
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(suggestion)}
                className="flex w-full flex-col px-3 py-2 text-left hover:bg-fond-neutre"
              >
                <span className="font-sans text-sm font-medium text-texte-principal">
                  {suggestion.nom}
                </span>
                <span className="font-sans text-xs text-texte-tertiaire">
                  {[suggestion.codePostal, suggestion.departement]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
