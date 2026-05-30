/**
 * Generic lead store (cœur du produit scout standalone).
 *
 * Contrairement aux mécanismes purs (claimable, entity-log…), c'est ici un
 * **modèle** : une table `leads` au schéma générique que toute instance scout
 * possède. Les champs spécifiques à un usage vivent dans `data jsonb` — pas de
 * colonne métier en dur. Le verrou (claimable) et le journal (entity-log) se
 * composent par-dessus côté routes.
 *
 * Schéma attendu (cf. migration 001_leads) :
 *   id serial PK, name text, status text, source text, data jsonb,
 *   claimed_by/claimed_by_name/claimed_at, created_at/by, updated_at/by.
 */
import type { ScoutSql } from "../db.js";

export interface Lead {
  id: number;
  name: string;
  status: string;
  source: string | null;
  data: Record<string, unknown>;
  claimedBy: string | null;
  claimedByName: string | null;
  claimedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface LeadListFilters {
  status?: string;
  source?: string;
  /** Recherche trgm sur `name`. */
  q?: string;
  /** true → seulement réclamés, false → seulement libres. */
  claimed?: boolean;
  limit?: number;
  offset?: number;
}

export interface LeadInput {
  name: string;
  status?: string;
  source?: string | null;
  data?: Record<string, unknown>;
  createdBy?: string | null;
}

export interface LeadPatch {
  name?: string;
  status?: string;
  source?: string | null;
  data?: Record<string, unknown>;
  updatedBy?: string | null;
}

export interface LeadsConfig {
  /** Statuts autorisés. Le premier est le défaut à la création. */
  statuses?: readonly string[];
}

const COLS = `id, name, status, source, data, claimed_by, claimed_by_name, claimed_at, created_at, created_by, updated_at, updated_by`;

export function makeLeads(sql: ScoutSql, cfg: LeadsConfig = {}) {
  const statuses = cfg.statuses ?? (["new", "qualified", "contacted", "won", "lost"] as const);
  const defaultStatus = statuses[0];

  function assertStatus(s: string): void {
    if (!statuses.includes(s)) {
      throw new Error(`Invalid status "${s}" (allowed: ${statuses.join(", ")})`);
    }
  }

  async function get(id: number): Promise<Lead | null> {
    const [row] = await sql<Lead[]>`SELECT ${sql.unsafe(COLS)} FROM leads WHERE id = ${id}`;
    return row ?? null;
  }

  async function list(f: LeadListFilters = {}): Promise<Lead[]> {
    const conds = [sql`TRUE`];
    if (f.status) conds.push(sql`status = ${f.status}`);
    if (f.source) conds.push(sql`source = ${f.source}`);
    if (f.q) conds.push(sql`name ILIKE ${"%" + f.q + "%"}`);
    if (f.claimed === true) conds.push(sql`claimed_by IS NOT NULL`);
    if (f.claimed === false) conds.push(sql`claimed_by IS NULL`);
    const where = conds.reduce((acc, c) => sql`${acc} AND ${c}`);
    return sql<Lead[]>`
      SELECT ${sql.unsafe(COLS)} FROM leads
      WHERE ${where}
      ORDER BY updated_at DESC
      LIMIT ${f.limit ?? 100} OFFSET ${f.offset ?? 0}
    `;
  }

  async function create(input: LeadInput): Promise<Lead> {
    const status = input.status ?? defaultStatus;
    assertStatus(status);
    const [row] = await sql<Lead[]>`
      INSERT INTO leads (name, status, source, data, created_by, updated_by)
      VALUES (
        ${input.name}, ${status}, ${input.source ?? null},
        ${sql.json((input.data ?? {}) as never)}, ${input.createdBy ?? null}, ${input.createdBy ?? null}
      )
      RETURNING ${sql.unsafe(COLS)}
    `;
    return row;
  }

  async function update(id: number, patch: LeadPatch): Promise<Lead | null> {
    if (patch.status !== undefined) assertStatus(patch.status);
    const sets = [sql`updated_at = now()`, sql`updated_by = ${patch.updatedBy ?? null}`];
    if (patch.name !== undefined) sets.push(sql`name = ${patch.name}`);
    if (patch.status !== undefined) sets.push(sql`status = ${patch.status}`);
    if (patch.source !== undefined) sets.push(sql`source = ${patch.source}`);
    if (patch.data !== undefined) sets.push(sql`data = ${sql.json(patch.data as never)}`);
    const setClause = sets.reduce((acc, s) => sql`${acc}, ${s}`);
    const [row] = await sql<Lead[]>`
      UPDATE leads SET ${setClause} WHERE id = ${id}
      RETURNING ${sql.unsafe(COLS)}
    `;
    return row ?? null;
  }

  async function remove(id: number): Promise<boolean> {
    const res = await sql`DELETE FROM leads WHERE id = ${id}`;
    return res.count > 0;
  }

  return { get, list, create, update, remove, statuses, defaultStatus };
}
