/**
 * Exclusive multi-user lock on a row (générique).
 *
 * Mécanisme pur : « réclamer » une entité pour un utilisateur (verrou exclusif),
 * « libérer » par le détenteur courant. Idempotent (réclamer son propre verrou
 * réussit). Aucune connaissance du domaine — table + colonne-clé paramétrées.
 *
 * Convention de colonnes (doivent exister sur la table) :
 *   claimed_by      text,
 *   claimed_by_name text,
 *   claimed_at      timestamptz
 *
 * Injection DB : le consommateur passe son instance `sql` (cf. {@link createScoutDb}).
 * Le logging / re-fetch éventuel reste à l'appelant (mécanisme pur).
 */
import type { ScoutSql } from "../db.js";

export interface ClaimableConfig {
  /** Table portant le verrou (identifiant SQL). */
  table: string;
  /** Colonne d'id d'entité (identifiant SQL). */
  keyColumn: string;
}

export function makeClaimable(sql: ScoutSql, cfg: ClaimableConfig) {
  /**
   * Réclame l'entité pour `by`. Renvoie true si le verrou est acquis (ou déjà
   * détenu par `by`), false s'il est tenu par quelqu'un d'autre / entité absente.
   */
  async function claim(entityId: string | number, by: string, byName: string | null): Promise<boolean> {
    const res = await sql`
      UPDATE ${sql(cfg.table)} SET claimed_by = ${by}, claimed_by_name = ${byName}, claimed_at = now()
      WHERE ${sql(cfg.keyColumn)} = ${entityId} AND (claimed_by IS NULL OR claimed_by = ${by})
    `;
    return res.count > 0;
  }

  /** Libère l'entité (seul le détenteur courant réussit). */
  async function release(entityId: string | number, by: string): Promise<boolean> {
    const res = await sql`
      UPDATE ${sql(cfg.table)} SET claimed_by = NULL, claimed_by_name = NULL, claimed_at = NULL
      WHERE ${sql(cfg.keyColumn)} = ${entityId} AND claimed_by = ${by}
    `;
    return res.count > 0;
  }

  return { claim, release };
}
