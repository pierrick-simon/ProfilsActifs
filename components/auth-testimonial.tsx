// Panneau témoignage (colonne de droite) affiché par-dessus le dégradé bleu.
// Reprend la disposition Figma : avatar, citation, auteur puis points de
// carrousel, avec le point actif dans la couleur action-sur-blanc.
export default function AuthTestimonial() {
  return (
    <div className="flex h-full items-center px-16">
      <div className="flex w-full max-w-[404px] flex-col gap-10">

        <div className="flex flex-col gap-7">
          <p className="font-sans text-2xl font-medium leading-snug text-texte-inverse">
            « Competences + aide les demandeurs d&apos;emploi à se présenter en vidéo et à être repérés par des recruteurs. »
          </p>
        </div>
      </div>
    </div>
  );
}
