/**
 * Provider-call logging + stats (enrichissement contacts).
 *
 * Générique : journalise les appels aux providers d'enrichissement (FullEnrich,
 * Kaspr, …) dans une table `provider_calls` et calcule des stats de hit-rate.
 *
 * Injection DB : scout ne possède pas de connexion — le consommateur passe son
 * instance `sql` (cf. {@link createScoutDb}). La table `provider_calls` doit
 * exister côté consommateur (migrations propres à son schéma) :
 *
 *   CREATE TABLE provider_calls (
 *     id            serial PRIMARY KEY,
 *     provider      text NOT NULL,
 *     siren         text,
 *     contact_id    integer,
 *     linkedin_slug text,
 *     success       boolean NOT NULL,
 *     phones_found  integer NOT NULL DEFAULT 0,
 *     emails_found  integer NOT NULL DEFAULT 0,
 *     credits_used  integer,
 *     error         text,
 *     created_at    timestamptz NOT NULL DEFAULT now()
 *   );
 */
import type { ScoutSql } from "../db.js";

export interface ProviderCallEntry {
  provider: string;
  siren?: string | null;
  contactId?: number | null;
  linkedinSlug?: string | null;
  success: boolean;
  phonesFound?: number;
  emailsFound?: number;
  creditsUsed?: number | null;
  error?: string | null;
}

/** Callback shape consumed by enrichment services to log each provider call. */
export type LogProviderCall = (entry: ProviderCallEntry) => Promise<void>;

export interface ProviderCall {
  id: number;
  provider: string;
  siren: string | null;
  contactId: number | null;
  linkedinSlug: string | null;
  success: boolean;
  phonesFound: number;
  emailsFound: number;
  creditsUsed: number | null;
  error: string | null;
  createdAt: string;
}

export interface ProviderStats {
  provider: string;
  totalCalls: number;
  successCalls: number;
  totalPhones: number;
  totalEmails: number;
  totalCredits: number | null;
  hitRate: number;
}

export function makeProviderCalls(sql: ScoutSql) {
  const log: LogProviderCall = async (entry) => {
    await sql`
      INSERT INTO provider_calls (provider, siren, contact_id, linkedin_slug, success, phones_found, emails_found, credits_used, error)
      VALUES (
        ${entry.provider}, ${entry.siren ?? null}, ${entry.contactId ?? null}, ${entry.linkedinSlug ?? null},
        ${entry.success}, ${entry.phonesFound ?? 0}, ${entry.emailsFound ?? 0},
        ${entry.creditsUsed ?? null}, ${entry.error ?? null}
      )
    `;
  };

  async function stats(days = 30): Promise<ProviderStats[]> {
    return sql<ProviderStats[]>`
      SELECT
        provider,
        COUNT(*)::int AS "totalCalls",
        COUNT(*) FILTER (WHERE success)::int AS "successCalls",
        COALESCE(SUM(phones_found), 0)::int AS "totalPhones",
        COALESCE(SUM(emails_found), 0)::int AS "totalEmails",
        SUM(credits_used)::int AS "totalCredits",
        ROUND(COUNT(*) FILTER (WHERE success)::numeric / NULLIF(COUNT(*), 0), 2)::float AS "hitRate"
      FROM provider_calls
      WHERE created_at > now() - make_interval(days => ${days})
      GROUP BY provider
      ORDER BY provider
    `;
  }

  async function recent(limit = 20): Promise<ProviderCall[]> {
    return sql<ProviderCall[]>`
      SELECT * FROM provider_calls ORDER BY created_at DESC LIMIT ${limit}
    `;
  }

  return { log, stats, recent };
}
