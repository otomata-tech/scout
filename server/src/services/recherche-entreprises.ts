/**
 * Wrapper TS de l'API Recherche Entreprises (data.gouv.fr).
 *
 * Endpoint : https://recherche-entreprises.api.gouv.fr/search — pas de clé requise.
 * Générique : aucune logique mission. Le filtre `idcc` (id_convention_collective)
 * et les autres filtres NAF/département/effectif sont exposés tels quels ;
 * c'est au consommateur de choisir les valeurs.
 */

const BASE = "https://recherche-entreprises.api.gouv.fr";

export interface ReSearchFilters {
  q?: string;
  naf?: string[];
  departement?: string;
  codePostal?: string;
  commune?: string;
  employees?: string[];
  caMin?: number;
  caMax?: number;
  idcc?: string[];
  page?: number;
  perPage?: number;
}

export interface ReDirigeant {
  nom?: string;
  prenoms?: string;
  qualite?: string;
  annee_de_naissance?: string;
  type_dirigeant?: string;
}

export interface ReSiege {
  siret?: string;
  adresse?: string;
  code_postal?: string;
  commune?: string;
  libelle_commune?: string;
  departement?: string;
  region?: string;
  latitude?: string;
  longitude?: string;
  activite_principale?: string;
  liste_idcc?: string[] | null;
  est_siege?: boolean;
  etat_administratif?: string;
}

export interface ReResult {
  siren: string;
  nom_complet: string;
  nom_raison_sociale?: string;
  sigle?: string | null;
  activite_principale?: string;
  categorie_entreprise?: string;
  date_creation?: string;
  date_fermeture?: string | null;
  tranche_effectif_salarie?: string;
  nature_juridique?: string;
  siege?: ReSiege;
  dirigeants?: ReDirigeant[];
  complements?: {
    liste_idcc?: string[] | null;
    convention_collective_renseignee?: boolean;
    est_association?: boolean;
    [k: string]: unknown;
  };
  matching_etablissements?: unknown[];
  finances?: Record<string, unknown> | null;
}

export interface ReSearchResponse {
  results: ReResult[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export async function search(filters: ReSearchFilters): Promise<ReSearchResponse> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.naf?.length) params.set("activite_principale", filters.naf.join(","));
  if (filters.departement) params.set("departement", filters.departement);
  if (filters.codePostal) params.set("code_postal", filters.codePostal);
  if (filters.commune) params.set("commune", filters.commune);
  if (filters.employees?.length)
    params.set("tranche_effectif_salarie_entreprise", filters.employees.join(","));
  if (filters.caMin !== undefined) params.set("ca_min", String(filters.caMin));
  if (filters.caMax !== undefined) params.set("ca_max", String(filters.caMax));
  if (filters.idcc?.length) params.set("id_convention_collective", filters.idcc.join(","));
  params.set("page", String(filters.page ?? 1));
  params.set("per_page", String(Math.min(filters.perPage ?? 25, 25)));

  const url = `${BASE}/search?${params.toString()}`;
  const resp = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`recherche-entreprises ${resp.status}: ${body.slice(0, 200)}`);
  }
  return resp.json() as Promise<ReSearchResponse>;
}

/**
 * Lookup direct par SIREN. Retourne null si introuvable.
 */
export async function getBySiren(siren: string): Promise<ReResult | null> {
  const resp = await search({ q: siren, perPage: 1 });
  const exact = resp.results.find((r) => r.siren === siren);
  return exact ?? resp.results[0] ?? null;
}
