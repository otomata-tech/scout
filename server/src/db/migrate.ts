/**
 * Migrations runner (scout standalone) — applique db/migrations/*.sql en ordre
 * numérique, idempotent via une table `migrations` qui track les filenames.
 *
 * Usage : `npm run migrate` (tsx src/db/migrate.ts) depuis server/.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { createScoutDb } from "../db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "migrations");

async function run() {
  const sql = createScoutDb(config.databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const applied = new Set(
    (await sql<{ filename: string }[]>`SELECT filename FROM migrations`).map((r) => r.filename),
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const f of files) {
    if (applied.has(f)) {
      console.log(`[migrate] skip ${f} (already applied)`);
      continue;
    }
    const content = readFileSync(join(MIGRATIONS_DIR, f), "utf8");
    console.log(`[migrate] apply ${f}`);
    await sql.unsafe(content);
    await sql`INSERT INTO migrations (filename) VALUES (${f})`;
  }

  console.log("[migrate] done");
  await sql.end();
}

run().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
