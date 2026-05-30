/**
 * Doctrine / CLAUDE.md d'un MCP, stockée en DB (générique).
 *
 * Source de vérité unique : table `settings` (key = 'claude_md'). Pas de
 * fallback hardcodé : si la row est absente ou vide, on lève. Cache in-process
 * (par client) → invalidé à l'écriture.
 *
 * Injection DB : le consommateur passe son instance `sql` (cf. {@link createScoutDb}).
 * La table `settings` doit exister :
 *
 *   CREATE TABLE settings (
 *     key        text PRIMARY KEY,
 *     value      text NOT NULL,
 *     updated_by text,
 *     updated_at timestamptz NOT NULL DEFAULT now()
 *   );
 */
import type { ScoutSql } from "../db.js";

export function makeClaudeMd(sql: ScoutSql, opts: { key?: string } = {}) {
  const KEY = opts.key ?? "claude_md";
  let cache: string | null = null;

  async function getClaudeMd(): Promise<string> {
    if (cache !== null) return cache;
    const rows = await sql<{ value: string }[]>`
      SELECT value FROM settings WHERE key = ${KEY}
    `;
    if (rows.length === 0 || !rows[0].value) {
      throw new Error(
        `Doctrine absente : aucune row settings.${KEY}. Elle doit être insérée via l'admin (PUT /api/claude-md).`,
      );
    }
    cache = rows[0].value;
    return cache;
  }

  async function setClaudeMd(content: string, updatedBy: string): Promise<void> {
    await sql`
      INSERT INTO settings (key, value, updated_by)
      VALUES (${KEY}, ${content}, ${updatedBy})
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by,
        updated_at = now()
    `;
    cache = content;
  }

  function invalidateCache(): void {
    cache = null;
  }

  return { getClaudeMd, setClaudeMd, invalidateCache };
}
