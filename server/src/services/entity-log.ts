/**
 * Append-only audit log keyed by an arbitrary entity (générique).
 *
 * Mécanisme pur : journal `(kind, content, metadata, created_by, created_at)`
 * attaché à une entité via une colonne-clé. Aucune connaissance du domaine —
 * la table et la colonne-clé sont paramétrées (ex. `lead_logs` / `siren`,
 * `company_logs` / `id`).
 *
 * Injection DB : le consommateur passe son instance `sql` (cf. {@link createScoutDb}).
 * Table attendue :
 *
 *   CREATE TABLE <table> (
 *     id          serial PRIMARY KEY,
 *     <keyColumn> <type> NOT NULL,
 *     kind        text NOT NULL,
 *     content     text NOT NULL,
 *     metadata    jsonb,
 *     created_by  text,
 *     created_at  timestamptz NOT NULL DEFAULT now()
 *   );
 */
import type { ScoutSql } from "../db.js";

export interface EntityLogRow {
  id: number;
  kind: string;
  content: string;
  metadata: Record<string, unknown> | null;
  createdBy: string | null;
  createdAt: string;
}

export interface EntityLogEntry {
  entityId: string | number;
  kind: string;
  content: string;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}

export interface EntityLogConfig {
  /** Nom de la table de logs (identifiant SQL). */
  table: string;
  /** Colonne portant l'id d'entité (identifiant SQL). */
  keyColumn: string;
}

export function makeEntityLog<Row extends EntityLogRow = EntityLogRow>(
  sql: ScoutSql,
  cfg: EntityLogConfig,
) {
  async function append(entry: EntityLogEntry): Promise<Row> {
    const [row] = await sql<Row[]>`
      INSERT INTO ${sql(cfg.table)} (${sql(cfg.keyColumn)}, kind, content, metadata, created_by)
      VALUES (
        ${entry.entityId}, ${entry.kind}, ${entry.content},
        ${sql.json((entry.metadata ?? null) as never)}, ${entry.createdBy ?? null}
      )
      RETURNING *
    `;
    return row;
  }

  async function listByEntity(entityId: string | number, limit = 50): Promise<Row[]> {
    return sql<Row[]>`
      SELECT * FROM ${sql(cfg.table)} WHERE ${sql(cfg.keyColumn)} = ${entityId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  }

  return { append, listByEntity };
}
