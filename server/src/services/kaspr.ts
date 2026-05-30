/**
 * Kaspr — enrichissement contacts B2B depuis LinkedIn (slug + nom).
 *
 * Endpoint : POST https://api.developers.kaspr.io/profile/linkedin
 * Auth     : header `Authorization: Bearer <api_key>` + `accept-version: v2.0`
 * Input    : { id: <linkedin-slug>, name: <full-name> }
 *
 * Générique : aucune logique mission. La clé API et le hook de logging
 * (`onCall`) sont injectés par le consommateur via {@link makeKaspr}.
 */

import type { LogProviderCall } from "./provider-calls.js";

const ENDPOINT = "https://api.developers.kaspr.io/profile/linkedin";

export interface KasprCompany {
  name?: string;
  universalName?: string;
  industries?: string[];
  domains?: string[];
  companyPageUrl?: string;
  staffCount?: number;
  industryName?: string;
  mainAddress?: {
    country?: string | null;
    city?: string | null;
    postalCode?: string | null;
    line1?: string | null;
  } | null;
}

export interface KasprProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  title?: string;
  companyName?: string;
  company?: KasprCompany | null;
  workEmails: string[];
  directEmails: string[];
  starryWorkEmail?: string | null;
  starryDirectEmail?: string | null;
  phones: string[];
  starryPhone?: string | null;
  location?: string | null;
  fetchedAt?: string;
}

interface RawResponse {
  profile?: Partial<KasprProfile> & {
    workEmails?: string[];
    directEmails?: string[];
    phones?: string[];
  };
  message?: string;
}

/**
 * Extrait le slug LinkedIn d'une URL ou retourne la string telle quelle.
 * Ex: "https://linkedin.com/in/john-doe/" → "john-doe"
 */
export function extractLinkedinSlug(input: string): string {
  const trimmed = input.trim().replace(/\/$/, "");
  const match = trimmed.match(/linkedin\.com\/in\/([^/?#]+)/i);
  return match ? match[1] : trimmed;
}

/**
 * Profile vide = Kaspr a 200 mais ne connaît pas le slug.
 */
export function isEmptyProfile(p: KasprProfile): boolean {
  return (
    !p.fetchedAt &&
    p.workEmails.length === 0 &&
    p.directEmails.length === 0 &&
    p.phones.length === 0 &&
    !p.companyName
  );
}

export interface KasprConfig {
  /** Clé API Kaspr. Si absente, `fetchKasprLinkedinProfile` lève à l'appel. */
  apiKey?: string;
  /** Hook de logging optionnel (cf. `makeProviderCalls().log`). */
  onCall?: LogProviderCall;
}

export function makeKaspr(cfg: KasprConfig) {
  /**
   * Récupère le profil Kaspr d'un LinkedIn (slug + nom).
   * Lève si HTTP !=2xx ou pas de `profile` dans la réponse.
   *
   * Note : Kaspr peut retourner 200 avec profil vide quand il ne connaît pas
   * le slug — l'appelant doit vérifier la présence de `fetchedAt` / emails.
   */
  async function fetchKasprLinkedinProfile(
    linkedinSlug: string,
    name: string,
    siren?: string | null,
  ): Promise<KasprProfile> {
    const apiKey = cfg.apiKey;
    if (!apiKey) {
      throw new Error(
        "KASPR_API_KEY manquante : passer `apiKey` à makeKaspr() côté consommateur.",
      );
    }

    const resp = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "accept-version": "v2.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: linkedinSlug,
        name,
        dataToGet: ["workEmail", "phone"],
        isPhoneRequired: true,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Kaspr ${resp.status}: ${body.slice(0, 200)}`);
    }

    const raw = (await resp.json()) as RawResponse;
    if (!raw.profile) {
      throw new Error(`Kaspr: réponse sans profile (message=${raw.message ?? "?"})`);
    }

    const p = raw.profile;
    const profile: KasprProfile = {
      id: linkedinSlug,
      firstName: p.firstName,
      lastName: p.lastName,
      name: p.name,
      title: p.title,
      companyName: p.companyName,
      company: p.company ?? null,
      workEmails: p.workEmails ?? [],
      directEmails: p.directEmails ?? [],
      starryWorkEmail: p.starryWorkEmail ?? null,
      starryDirectEmail: p.starryDirectEmail ?? null,
      phones: p.phones ?? [],
      starryPhone: p.starryPhone ?? null,
      location: p.location ?? null,
      fetchedAt: p.fetchedAt,
    };

    await cfg.onCall?.({
      provider: "kaspr", siren, linkedinSlug,
      success: !isEmptyProfile(profile),
      phonesFound: profile.phones.length, emailsFound: profile.workEmails.length,
      creditsUsed: 1,
    });

    return profile;
  }

  return { fetchKasprLinkedinProfile };
}
