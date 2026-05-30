/**
 * API token service (générique) : génération, hash SHA-256, vérification.
 *
 * Injection DB : le consommateur passe son instance `sql` (cf. {@link createScoutDb})
 * et, optionnellement, un préfixe de token. La table `api_tokens` doit exister :
 *
 *   CREATE TABLE api_tokens (
 *     id          serial PRIMARY KEY,
 *     user_sub    text NOT NULL,
 *     name        text NOT NULL,
 *     token_hash  text NOT NULL UNIQUE,
 *     last_used_at timestamptz,
 *     expires_at  timestamptz,
 *     revoked_at  timestamptz,
 *     created_at  timestamptz NOT NULL DEFAULT now()
 *   );
 */
import crypto from "node:crypto";
import type { ScoutSql } from "../db.js";

export interface ApiToken {
  id: number;
  userSub: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export function makeApiTokens(sql: ScoutSql, opts: { prefix?: string } = {}) {
  const PREFIX = opts.prefix ?? "tok_";

  async function create(userSub: string, name: string): Promise<{ id: number; token: string }> {
    const raw = crypto.randomBytes(32).toString("hex");
    const token = PREFIX + raw;
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const [row] = await sql<{ id: number }[]>`
      INSERT INTO api_tokens (user_sub, name, token_hash)
      VALUES (${userSub}, ${name}, ${hash})
      RETURNING id
    `;
    return { id: row.id, token };
  }

  async function verify(token: string): Promise<string | null> {
    if (!token.startsWith(PREFIX)) return null;
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const [row] = await sql<{ userSub: string }[]>`
      UPDATE api_tokens SET last_used_at = now()
      WHERE token_hash = ${hash} AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > now())
      RETURNING user_sub
    `;
    return row?.userSub ?? null;
  }

  async function listByUser(userSub: string): Promise<ApiToken[]> {
    return sql<ApiToken[]>`
      SELECT id, user_sub, name, last_used_at, expires_at, revoked_at, created_at
      FROM api_tokens
      WHERE user_sub = ${userSub}
      ORDER BY created_at DESC
    `;
  }

  async function revoke(id: number, userSub: string): Promise<boolean> {
    const result = await sql`
      UPDATE api_tokens SET revoked_at = now()
      WHERE id = ${id} AND user_sub = ${userSub} AND revoked_at IS NULL
    `;
    return result.count > 0;
  }

  return { create, verify, listByUser, revoke };
}
