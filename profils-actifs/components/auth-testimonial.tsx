// Panneau témoignage (colonne de droite) affiché par-dessus le dégradé bleu.
// Reprend la disposition Figma : avatar, citation, auteur puis points de
// carrousel, avec le point actif dans la couleur action-sur-blanc.
export default function AuthTestimonial() {
  return (
    <div className="flex h-full items-center px-16">
      <div className="flex w-full max-w-[404px] flex-col gap-10">
        <span className="flex size-12 items-center justify-center rounded-full bg-action-sur-bleu font-sans text-sm font-medium text-texte-sur-action-clair">
          WC
        </span>

        <div className="flex flex-col gap-7">
          <p className="font-sans text-2xl font-medium leading-snug text-texte-inverse">
            « ProfilsActifs aide les demandeurs d&apos;emploi à se présenter en vidéo et à être repérés par des recruteurs. »
          </p>
          <div className="flex flex-col gap-1">
            <p className="font-sans text-base font-medium text-texte-inverse">Wei Chen</p>
            <p className="font-sans text-sm text-texte-inverse/70">Directrice RH · Catalyst</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1 w-4 rounded-full bg-action-sur-blanc" />
          <span className="size-1 rounded-full bg-texte-inverse/40" />
          <span className="size-1 rounded-full bg-texte-inverse/40" />
        </div>
      </div>
    </div>
  );
}
