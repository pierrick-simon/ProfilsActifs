export type CommuneSuggestion = {
  nom: string;
  code: string;
  codePostal: string;
  departement: string;
  label: string;
};

type GeoCommune = {
  nom: string;
  code: string;
  codesPostaux?: string[];
  departement?: { nom?: string; code?: string };
};

export async function searchCommunes(
  query: string,
  signal?: AbortSignal,
): Promise<CommuneSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    fields: "nom,code,codesPostaux,departement",
    limit: "8",
  });

  if (/^\d{5}$/.test(trimmed)) {
    params.set("codePostal", trimmed);
  } else if (/^\d{2}$/.test(trimmed)) {
    params.set("codeDepartement", trimmed);
  } else {
    params.set("nom", trimmed);
    params.set("boost", "population");
  }

  const response = await fetch(`https://geo.api.gouv.fr/communes?${params}`, {
    signal,
  });
  if (!response.ok) {
    return [];
  }

  const communes: GeoCommune[] = await response.json();
  return communes.map((commune) => {
    const codes = Array.isArray(commune.codesPostaux) ? commune.codesPostaux : [];
    const codePostal =
      codes.find((code) => code.startsWith(trimmed)) ?? codes[0] ?? "";
    const department = commune.departement?.nom ?? "";
    return {
      nom: commune.nom,
      code: commune.code,
      codePostal,
      departement: department,
      label: codePostal
        ? `${commune.nom}, ${codePostal}`
        : commune.nom,
    };
  });
}
