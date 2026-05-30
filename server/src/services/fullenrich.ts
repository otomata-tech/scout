/**
 * FullEnrich — enrichissement contacts B2B via waterfall (20+ providers).
 *
 * Auth   : header `Authorization: Bearer <api_key>` (clé UUID v4)
 * Async  : POST → enrichment_id, puis GET (polling toutes les ~8s, ~1-2 min total)
 * Pricing: 10 cr/phone, 1 cr/work_email, 3 cr/personal_email. Pay-per-result.
 *
 * Générique : aucune logique mission. Clé API + hook de logging (`onCall`) +
 * préfixe de batch injectés via {@link makeFullenrich}.
 */

import type { LogProviderCall } from "./provider-calls.js";

const BASE = "https://app.fullenrich.com/api/v2";
const POLL_INTERVAL_MS = 8000;
const POLL_MAX_ATTEMPTS = 30; // ~4 min worst case

export interface FullenrichProfile {
  linkedinSlug: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  title: string | null;
  companyName: string | null;
  phones: string[];
  workEmails: string[];
  personalEmails: string[];
  location: string | null;
  rawData: Record<string, unknown> | null;
  fetchedAt: string;
}

interface PostResponse {
  enrichment_id: string;
}

interface GetResponse {
  id: string;
  status: "IN_PROGRESS" | "FINISHED" | "CREDITS_INSUFFICIENT" | string;
  cost?: { credits: number };
  data: Array<{
    input: Record<string, unknown>;
    custom?: Record<string, unknown>;
    contact_info?: {
      phones?: Array<{ number: string }>;
      work_emails?: Array<{ email: string }>;
      personal_emails?: Array<{ email: string }>;
    };
    profile?: {
      full_name?: string;
      first_name?: string;
      last_name?: string;
      location?: { city?: string; country?: string };
      employment?: { all?: Array<{ title?: string; company?: { name?: string } }> };
    };
  }>;
}

export interface FullenrichConfig {
  /** Clé API FullEnrich. Si absente, `fetchFullenrichProfile` lève à l'appel. */
  apiKey?: string;
  /** Hook de logging optionnel (cf. `makeProviderCalls().log`). */
  onCall?: LogProviderCall;
  /** Préfixe du nom de batch envoyé à FullEnrich (défaut "scout"). */
  batchPrefix?: string;
}

export function makeFullenrich(cfg: FullenrichConfig) {
  async function fetchFullenrichProfile(
    linkedinSlug: string,
    name: string,
    companyName?: string,
    siren?: string | null,
  ): Promise<FullenrichProfile | null> {
    const apiKey = cfg.apiKey;
    if (!apiKey) {
      throw new Error(
        "FULLENRICH_API_KEY manquante : passer `apiKey` à makeFullenrich() côté consommateur.",
      );
    }

    const [firstName, ...rest] = name.trim().split(/\s+/);
    const lastName = rest.join(" ");

    const postResp = await fetch(`${BASE}/contact/enrich/bulk`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${cfg.batchPrefix ?? "scout"}-${Date.now()}`,
        data: [{
          first_name: firstName,
          last_name: lastName,
          company_name: companyName,
          linkedin_url: `https://www.linkedin.com/in/${linkedinSlug}/`,
          enrich_fields: ["contact.work_emails", "contact.phones"],
          custom: { slug: linkedinSlug },
        }],
      }),
    });
    if (!postResp.ok) {
      const body = await postResp.text();
      throw new Error(`FullEnrich POST ${postResp.status}: ${body.slice(0, 200)}`);
    }
    const { enrichment_id } = (await postResp.json()) as PostResponse;

    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const getResp = await fetch(`${BASE}/contact/enrich/bulk/${enrichment_id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!getResp.ok) {
        const body = await getResp.text();
        throw new Error(`FullEnrich GET ${getResp.status}: ${body.slice(0, 200)}`);
      }
      const data = (await getResp.json()) as GetResponse;
      if (data.status === "CREDITS_INSUFFICIENT") {
        throw new Error("FullEnrich : crédits insuffisants. Recharger sur app.fullenrich.com.");
      }
      if (data.status !== "FINISHED") continue;

      const item = data.data?.[0];
      if (!item) return null;
      const ci = item.contact_info ?? {};
      const phones = (ci.phones ?? []).map((p) => p.number);
      const workEmails = (ci.work_emails ?? []).map((e) => e.email);
      const personalEmails = (ci.personal_emails ?? []).map((e) => e.email);

      if (phones.length === 0 && workEmails.length === 0 && personalEmails.length === 0) {
        await cfg.onCall?.({ provider: "fullenrich", siren, linkedinSlug, success: false, creditsUsed: 0 });
        return null;
      }

      await cfg.onCall?.({
        provider: "fullenrich", siren, linkedinSlug,
        success: true, phonesFound: phones.length, emailsFound: workEmails.length,
        creditsUsed: phones.length * 10 + workEmails.length * 1,
      });

      const profile = item.profile ?? {};
      const employment = profile.employment?.all?.[0];
      const location = profile.location
        ? [profile.location.city, profile.location.country].filter(Boolean).join(", ") || null
        : null;

      return {
        linkedinSlug,
        firstName: profile.first_name ?? firstName,
        lastName: profile.last_name ?? lastName,
        fullName: profile.full_name ?? name,
        title: employment?.title ?? null,
        companyName: employment?.company?.name ?? companyName ?? null,
        phones,
        workEmails,
        personalEmails,
        location,
        rawData: item as unknown as Record<string, unknown>,
        fetchedAt: new Date().toISOString(),
      };
    }
    throw new Error("FullEnrich : timeout polling (>4 min)");
  }

  return { fetchFullenrichProfile };
}
