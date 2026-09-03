import { ChevronRightIcon } from "@/components/icons";

// Indicateur d'étapes du questionnaire d'inscription : pastilles numérotées
// reliées par des chevrons, l'étape courante étant remplie en bleu.
export default function QuestionStepper({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const steps = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <div className="flex items-center gap-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-4">
          <span
            className={`flex size-6 items-center justify-center rounded-full font-sans text-xs font-medium ${
              step === current
                ? "bg-bleu-institutionnel text-texte-inverse"
                : "border border-bordure-defaut bg-fond-page text-texte-secondaire"
            }`}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <ChevronRightIcon className="size-4 text-texte-tertiaire" />
          )}
        </div>
      ))}
    </div>
  );
}
