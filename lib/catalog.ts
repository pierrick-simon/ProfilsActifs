import { ActivitySector } from "@/prisma/prisma/enums";

const VALID_SECTORS = Object.values(ActivitySector);

/**
 * Ordre et pagination du catalogue de profils (GET /api/videos).
 *
 * Tri par défaut : date de dernière mise à jour du profil (décroissante), avec
 * l'identifiant de la vidéo en clé de départage. Deux colonnes toujours : un
 * ORDER BY à une seule colonne n'offre aucune garantie d'ordre stable entre
 * deux profils partageant la même date de mise à jour.
 *
 * Voir docs/catalogue-tri-et-pagination.md pour la note destinée au client.
 */
export const CATALOG_ORDER_BY = [
  { user: { updatedAt: "desc" as const } },
  { id: "desc" as const },
];

export type CatalogCursor = { u: string; id: string };

export function encodeCatalogCursor(cursor: CatalogCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCatalogCursor(raw: string): CatalogCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.u !== "string" || typeof parsed?.id !== "string") {
      return null;
    }
    if (Number.isNaN(new Date(parsed.u).getTime())) {
      return null;
    }
    return { u: parsed.u, id: parsed.id };
  } catch {
    return null;
  }
}

// Filtre "keyset" manuel (plutôt que l'option `cursor` native de Prisma) : le
// tri porte sur un champ de la relation `user`, et on veut que la comparaison
// (< date, ou date égale + id <) soit explicite et documentable telle quelle,
// plutôt que de dépendre d'un comportement interne non garanti pour un ORDER
// BY sur relation combiné à `cursor`/`skip`.
export function catalogCursorWhere(cursor: CatalogCursor | null) {
  if (!cursor) {
    return {};
  }
  const updatedAt = new Date(cursor.u);
  return {
    OR: [
      { user: { updatedAt: { lt: updatedAt } } },
      { user: { updatedAt }, id: { lt: cursor.id } },
    ],
  };
}

export function nextCatalogCursor(lastItem: { id: string; user: { updatedAt: Date } }): string {
  return encodeCatalogCursor({ u: lastItem.user.updatedAt.toISOString(), id: lastItem.id });
}

export type CatalogFilterResult =
  | { ok: true; where: Record<string, unknown> }
  | { ok: false; error: string };

// Filtres professionnels du catalogue : secteur, localisation, certification,
// compétence. Aucun critère de popularité n'est lu ici, par construction —
// cette fonction n'accepte que ces paramètres de query string, rien d'autre.
export function parseCatalogFilters(searchParams: URLSearchParams): CatalogFilterResult {
  const sectorParam = searchParams.get("sector");
  if (sectorParam !== null && !VALID_SECTORS.includes(sectorParam as ActivitySector)) {
    return {
      ok: false,
      error: `sector doit être l'une des valeurs suivantes : ${VALID_SECTORS.join(", ")}`,
    };
  }

  const certifiedParam = searchParams.get("certified");
  if (certifiedParam !== null && certifiedParam !== "true" && certifiedParam !== "false") {
    return { ok: false, error: "certified doit valoir 'true' ou 'false'" };
  }

  const locationParam = searchParams.get("location");
  const skillParam = searchParams.get("skill");

  const userWhere: Record<string, unknown> = {};
  if (sectorParam) {
    userWhere.activitySector = sectorParam;
  }
  if (locationParam) {
    userWhere.localisation = { contains: locationParam, mode: "insensitive" };
  }
  if (certifiedParam === "true") {
    userWhere.certification = { not: null };
  } else if (certifiedParam === "false") {
    userWhere.certification = null;
  }
  if (skillParam) {
    // skillParam est l'id d'une compétence (cf. GET /api/skill) : "some" car un
    // profil peut avoir plusieurs compétences, on veut celles qui ont au moins
    // celle-ci. Un id inexistant ne donne aucune erreur, juste zéro résultat.
    userWhere.userSkill = { some: { skillId: skillParam } };
  }

  return { ok: true, where: Object.keys(userWhere).length > 0 ? { user: userWhere } : {} };
}
