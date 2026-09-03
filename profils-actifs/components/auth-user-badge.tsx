import { UserIcon } from "@/components/icons";


export default function AuthUserBadge() {
  return (
    <span className="inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-bleu-institutionnel/10 to-fond-bleu-clair/40 p-3">
      <span className="flex items-center justify-center overflow-hidden rounded-full bg-fond-page p-3.5 shadow-[0px_48px_48px_-24px_rgba(183,83,16,0.04),0px_24px_24px_-12px_rgba(183,83,16,0.04),0px_12px_12px_-6px_rgba(183,83,16,0.04),0px_6px_6px_-3px_rgba(183,83,16,0.04),0px_3px_3px_-1.5px_rgba(183,83,16,0.02),0px_1px_1px_0.5px_rgba(183,83,16,0.04),0px_0px_0px_1px_rgba(183,83,16,0.04),inset_0px_-1px_1px_-0.5px_rgba(183,83,16,0.06)]">
        <UserIcon className="size-7 text-bleu-institutionnel" />
      </span>
    </span>
  );
}
