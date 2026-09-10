"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CloseIcon, PlusIcon } from "@/components/icons";
import { useToast } from "@/components/toast";

type QuestionType =
  | "single-choice"
  | "multiple-choice"
  | "true-false"
  | "free-answer"
  | "date"
  | "numeric";

type AdminQuestion = {
  id: number;
  question: string;
  type: QuestionType;
  weight: number;
  options: {
    choices?: string[];
    answer?: string | string[] | boolean | number | null;
  };
};

const TYPE_LABELS: Record<QuestionType, string> = {
  "single-choice": "Choix unique",
  "multiple-choice": "Choix multiple",
  "true-false": "Vrai / faux",
  "free-answer": "Réponse libre",
  "date": "Date",
  "numeric": "Nombre",
};

const TYPES = Object.keys(TYPE_LABELS) as QuestionType[];

function defaultOptions(type: QuestionType): AdminQuestion["options"] {
  switch (type) {
    case "single-choice":
      return { choices: ["", ""], answer: "" };
    case "multiple-choice":
      return { choices: ["", ""], answer: [] };
    case "true-false":
      return { answer: true };
    case "free-answer":
      return { answer: null };
    case "date":
      return { answer: "" };
    case "numeric":
      return { answer: 0 };
  }
}

function nextId(questions: AdminQuestion[]): number {
  return questions.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function parseQuestions(raw: unknown): AdminQuestion[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((item, index) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }
    const row = item as Record<string, unknown>;
    const type = TYPES.includes(row.type as QuestionType)
      ? (row.type as QuestionType)
      : "single-choice";
    const options =
      typeof row.options === "object" && row.options !== null
        ? (row.options as AdminQuestion["options"])
        : defaultOptions(type);
    return [
      {
        id: typeof row.id === "number" ? row.id : index + 1,
        question: typeof row.question === "string" ? row.question : "",
        type,
        weight: typeof row.weight === "number" ? row.weight : 1,
        options,
      },
    ];
  });
}

function payloadOf(questions: AdminQuestion[]) {
  return {
    questions: questions.map((item) => ({
      id: item.id,
      question: item.question.trim(),
      type: item.type,
      weight: item.weight,
      options: item.options,
    })),
  };
}

export default function FormEditor() {
  const { showError } = useToast();
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [formVersion, setFormVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/form");
        if (response.status === 404) {
          if (alive) {
            setQuestions([]);
            setFormVersion(null);
          }
          return;
        }
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            Array.isArray(data.details) ? data.details.join(" ") : "form unavailable",
          );
        }
        if (alive) {
          setQuestions(parseQuestions(data.questions));
          setFormVersion(
            typeof data.formVersion === "number" ? data.formVersion : null,
          );
        }
      } catch (error) {
        if (alive) {
          showError(
            error instanceof Error
              ? error.message
              : "Impossible de charger le questionnaire.",
            "Questionnaire",
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

  function update(id: number, patch: Partial<AdminQuestion>) {
    setQuestions((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    setSaved(false);
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        id: nextId(current),
        question: "",
        type: "single-choice",
        weight: 1,
        options: defaultOptions("single-choice"),
      },
    ]);
    setSaved(false);
  }

  function removeQuestion(id: number) {
    setQuestions((current) => current.filter((item) => item.id !== id));
    setSaved(false);
  }

  async function save() {
    if (saving) {
      return;
    }
    if (questions.length === 0) {
      showError("Ajoutez au moins une question.", "Questionnaire");
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch("/api/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadOf(questions)),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const details = Array.isArray(data?.details)
          ? data.details.join(" ")
          : data?.error;
        throw new Error(details || "Enregistrement impossible");
      }
      const reload = await fetch("/api/form");
      if (reload.ok) {
        const next = await reload.json();
        setQuestions(parseQuestions(next.questions));
        setFormVersion(
          typeof next.formVersion === "number" ? next.formVersion : null,
        );
      }
      setSaved(true);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Enregistrement impossible",
        "Questionnaire",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-sans text-lg font-bold text-texte-principal">
            Questions du questionnaire
          </h3>
          <p className="font-sans text-sm text-texte-tertiaire">
            {formVersion !== null
              ? `Version ${formVersion} · ${questions.length} question${questions.length > 1 ? "s" : ""}`
              : `${questions.length} question${questions.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved ? (
            <span className="font-sans text-sm font-medium text-emerald-700">
              Enregistré
            </span>
          ) : null}
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center gap-2 rounded-lg border border-bordure-defaut bg-fond-page px-4 py-2.5 font-sans text-sm font-medium text-texte-secondaire shadow-sm transition-colors hover:bg-fond-neutre"
          >
            <PlusIcon className="size-4" />
            Ajouter
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="inline-flex items-center justify-center rounded-lg bg-bleu-institutionnel px-4 py-2.5 font-sans text-sm font-medium text-texte-inverse shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl bg-fond-page"
            />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-bordure-forte bg-fond-page p-12 text-center">
          <p className="mb-4 font-sans text-sm text-texte-tertiaire">
            Aucune question pour le moment.
          </p>
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center gap-2 rounded-lg bg-bleu-institutionnel px-4 py-2.5 font-sans text-sm font-medium text-texte-inverse"
          >
            <PlusIcon className="size-4" />
            Ajouter une question
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {questions.map((item, index) => (
            <QuestionCard
              key={item.id}
              index={index}
              question={item}
              canRemove={questions.length > 1}
              onChange={(patch) => update(item.id, patch)}
              onRemove={() => removeQuestion(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  index,
  question,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  question: AdminQuestion;
  canRemove: boolean;
  onChange: (patch: Partial<AdminQuestion>) => void;
  onRemove: () => void;
}) {
  function setType(type: QuestionType) {
    onChange({ type, options: defaultOptions(type) });
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-bordure-defaut bg-fond-page p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <span className="mt-2 shrink-0 font-sans text-xs font-semibold uppercase tracking-wider text-texte-tertiaire">
          Q{index + 1}
        </span>
        <textarea
          value={question.question}
          onChange={(event) => onChange({ question: event.target.value })}
          placeholder="Énoncé de la question"
          rows={2}
          className="min-h-[64px] flex-1 resize-y rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
        />
        <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
          <select
            value={question.type}
            onChange={(event) => setType(event.target.value as QuestionType)}
            className="rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2 font-sans text-sm text-texte-principal focus:border-bleu-institutionnel focus:outline-none"
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 font-sans text-sm text-texte-secondaire">
            Poids
            <input
              type="number"
              min={0}
              step={1}
              value={question.weight}
              onChange={(event) =>
                onChange({ weight: Number(event.target.value) || 0 })
              }
              className="w-16 rounded-lg border border-bordure-defaut bg-fond-page px-2 py-1.5 font-sans text-sm text-texte-principal focus:border-bleu-institutionnel focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label="Supprimer la question"
            title="Supprimer"
            className="flex size-10 items-center justify-center rounded-lg border border-bordure-defaut text-texte-secondaire transition-colors hover:border-erreur/30 hover:bg-erreur/10 hover:text-erreur disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      </div>

      <QuestionOptions question={question} onChange={onChange} />
    </article>
  );
}

function QuestionOptions({
  question,
  onChange,
}: {
  question: AdminQuestion;
  onChange: (patch: Partial<AdminQuestion>) => void;
}) {
  if (question.type === "free-answer") {
    return (
      <p className="font-sans text-sm text-texte-tertiaire">
        Toute réponse non vide est acceptée.
      </p>
    );
  }

  if (question.type === "true-false") {
    const value = question.options.answer === true;
    return (
      <div className="flex gap-2">
        <ChoiceButton
          label="Vrai"
          selected={value}
          onClick={() => onChange({ options: { answer: true } })}
        />
        <ChoiceButton
          label="Faux"
          selected={!value}
          onClick={() => onChange({ options: { answer: false } })}
        />
      </div>
    );
  }

  if (question.type === "numeric") {
    return (
      <label className="flex max-w-xs flex-col gap-1 font-sans text-sm font-medium text-texte-principal">
        Réponse attendue
        <input
          type="number"
          value={typeof question.options.answer === "number" ? question.options.answer : 0}
          onChange={(event) => {
            const value = Number(event.target.value);
            onChange({
              options: { answer: Number.isNaN(value) ? 0 : value },
            });
          }}
          className="rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 font-sans text-sm font-normal text-texte-principal focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
        />
      </label>
    );
  }

  if (question.type === "date") {
    return (
      <label className="flex max-w-xs flex-col gap-1 font-sans text-sm font-medium text-texte-principal">
        Réponse attendue
        <input
          type="text"
          inputMode="numeric"
          placeholder="jj-mm-aaaa"
          value={typeof question.options.answer === "string" ? question.options.answer : ""}
          onChange={(event) =>
            onChange({ options: { answer: event.target.value } })
          }
          className="rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2.5 font-sans text-sm font-normal text-texte-principal placeholder:text-texte-tertiaire focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
        />
      </label>
    );
  }

  const choices = question.options.choices ?? [];
  const multiple = question.type === "multiple-choice";
  const selected = multiple
    ? Array.isArray(question.options.answer)
      ? question.options.answer
      : []
    : typeof question.options.answer === "string"
      ? question.options.answer
      : "";

  function setChoices(next: string[]) {
    if (multiple) {
      const current = Array.isArray(question.options.answer)
        ? question.options.answer
        : [];
      onChange({
        options: {
          choices: next,
          answer: current.filter((item) => next.includes(item)),
        },
      });
      return;
    }
    const current =
      typeof question.options.answer === "string"
        ? question.options.answer
        : "";
    onChange({
      options: {
        choices: next,
        answer: next.includes(current) ? current : "",
      },
    });
  }

  function toggleAnswer(choice: string) {
    if (multiple) {
      const current = Array.isArray(question.options.answer)
        ? question.options.answer
        : [];
      onChange({
        options: {
          choices,
          answer: current.includes(choice)
            ? current.filter((item) => item !== choice)
            : [...current, choice],
        },
      });
      return;
    }
    onChange({ options: { choices, answer: choice } });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-sans text-sm font-medium text-texte-principal">
        Choix {multiple ? "(cochez les bonnes réponses)" : "(sélectionnez la bonne réponse)"}
      </p>
      {choices.map((choice, index) => {
        const isSelected = Array.isArray(selected)
          ? selected.includes(choice) && choice !== ""
          : selected === choice && choice !== "";
        return (
          <div key={index} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleAnswer(choice)}
              disabled={choice.trim() === ""}
              aria-pressed={isSelected}
              className={`flex size-5 shrink-0 items-center justify-center border ${
                multiple ? "rounded-md" : "rounded-full"
              } ${
                isSelected
                  ? "border-bleu-institutionnel bg-bleu-institutionnel"
                  : "border-bordure-forte bg-fond-page"
              } disabled:opacity-40`}
            >
              {isSelected ? (
                multiple ? (
                  <CheckIcon className="size-3 text-texte-inverse" />
                ) : (
                  <span className="size-2 rounded-full bg-fond-page" />
                )
              ) : null}
            </button>
            <input
              type="text"
              value={choice}
              onChange={(event) => {
                const next = [...choices];
                const previous = next[index];
                next[index] = event.target.value;
                if (multiple) {
                  const current = Array.isArray(question.options.answer)
                    ? question.options.answer
                    : [];
                  onChange({
                    options: {
                      choices: next,
                      answer: current.map((item) =>
                        item === previous ? event.target.value : item,
                      ),
                    },
                  });
                  return;
                }
                onChange({
                  options: {
                    choices: next,
                    answer:
                      question.options.answer === previous
                        ? event.target.value
                        : question.options.answer,
                  },
                });
              }}
              placeholder={`Choix ${index + 1}`}
              className="flex-1 rounded-lg border border-bordure-defaut bg-fond-page px-3 py-2 font-sans text-sm text-texte-principal placeholder:text-texte-tertiaire focus:border-bleu-institutionnel focus:outline-none focus:ring-2 focus:ring-fond-bleu-clair"
            />
            <button
              type="button"
              onClick={() => setChoices(choices.filter((_, i) => i !== index))}
              disabled={choices.length <= 2}
              aria-label="Retirer ce choix"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-texte-tertiaire transition-colors hover:bg-fond-neutre hover:text-erreur disabled:opacity-30"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => setChoices([...choices, ""])}
        className="inline-flex w-fit items-center gap-1 rounded-lg px-2 py-1.5 font-sans text-sm font-medium text-bleu-institutionnel transition-colors hover:bg-fond-bleu-clair"
      >
        <PlusIcon className="size-4" />
        Ajouter un choix
      </button>
    </div>
  );
}

function ChoiceButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 font-sans text-sm font-medium transition-colors ${
        selected
          ? "border-bleu-institutionnel bg-fond-bleu-clair text-bleu-institutionnel"
          : "border-bordure-defaut bg-fond-page text-texte-secondaire hover:bg-fond-neutre"
      }`}
    >
      {label}
    </button>
  );
}
