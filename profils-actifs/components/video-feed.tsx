import {
  BellIcon,
  HeartIcon,
  HomeIcon,
  MessageIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
} from "@/components/icons";


export default function VideoFeed() {
  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-3">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-bleu-institutionnel">
        <div className="flex h-full items-center justify-center">
          <span className="font-sans text-sm font-medium text-texte-inverse/70">
            Vidéo de présentation
          </span>
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col items-center gap-5 text-texte-inverse">
          <button
            type="button"
            className="relative"
            aria-label="Suivre ce profil"
          >
            <span className="flex size-11 items-center justify-center rounded-full border-2 border-texte-inverse bg-fond-bleu-clair text-sm font-medium text-bleu-institutionnel">
              AK
            </span>
            <span className="absolute -bottom-1.5 left-1/2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full bg-action-sur-blanc text-texte-inverse">
              <PlusIcon className="size-3" />
            </span>
          </button>

          <FeedAction label="328,7 k" ariaLabel="J'aime">
            <HeartIcon className="size-8" filled />
          </FeedAction>

          <FeedAction label="578" ariaLabel="Commentaires">
            <MessageIcon className="size-8" />
          </FeedAction>

          <FeedAction label="Partager" ariaLabel="Partager">
            <ShareIcon className="size-8" />
          </FeedAction>
        </div>
      </div>

      <FeedNavBar />
    </div>
  );
}

type FeedActionProps = {
  label: string;
  ariaLabel: string;
  children: React.ReactNode;
};

function FeedAction({ label, ariaLabel, children }: FeedActionProps) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 drop-shadow-[1px_1px_0_rgba(0,0,0,0.3)]"
      aria-label={ariaLabel}
    >
      {children}
      <span className="font-sans text-[13px] font-medium">{label}</span>
    </button>
  );
}

function FeedNavBar() {
  return (
    <nav className="flex w-full items-center justify-between gap-2 rounded-[20px] border border-bordure-defaut bg-fond-page px-5 py-4 shadow-[0_10px_20px_-8px_rgba(20,33,61,0.15)]">
      <button type="button" aria-label="Accueil" className="text-texte-principal">
        <HomeIcon className="size-6" />
      </button>
      <button type="button" aria-label="Rechercher" className="text-texte-secondaire">
        <SearchIcon className="size-5" />
      </button>
      <button
        type="button"
        className="rounded-[10px] border border-bordure-defaut px-4 py-1.5 font-sans text-sm font-medium text-texte-secondaire shadow-[0_1px_2px_0_rgba(10,13,20,0.03)]"
      >
        Créer
      </button>
      <button type="button" aria-label="Notifications" className="text-texte-secondaire">
        <BellIcon className="size-5" />
      </button>
      <span className="flex size-8 items-center justify-center rounded-full bg-action-sur-bleu text-xs font-medium text-texte-sur-action-clair">
        AK
      </span>
    </nav>
  );
}
