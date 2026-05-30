import postgres from "postgres";

/** Postgres client type as produced by {@link createScoutDb}. */
export type ScoutSql = ReturnType<typeof postgres>;

/**
 * Create a configured Postgres client for a scout consumer.
 *
 * scout does **not** own a database connection : the consumer calls this with
 * its own `DATABASE_URL` and injects the resulting `sql` into the DB-backed
 * service factories (`makeApiTokens`, `makeProviderCalls`, `makeClaudeMd`).
 *
 * Defaults baked in (generic, shared by every mission) :
 * - `transform: camel` — snake_case columns → camelCase fields.
 * - dates/timestamps returned as ISO strings (not `Date`) so they match zod
 *   `z.string()` response schemas instead of failing serialization.
 */
export function createScoutDb(
  url: string | undefined,
  options: { max?: number; idleTimeout?: number } = {},
): ScoutSql {
  if (!url) {
    throw new Error(
      "createScoutDb: DATABASE_URL is required. Ensure the consumer's env provides it.",
    );
  }
  return postgres(url, {
    transform: postgres.camel,
    max: options.max ?? 10,
    idle_timeout: options.idleTimeout ?? 20,
    types: {
      date: {
        to: 1184,
        from: [1082, 1083, 1114, 1184],
        serialize: (x: Date | string) => (x instanceof Date ? x.toISOString() : x),
        parse: (x: string) => x,
      },
    },
  });
}
