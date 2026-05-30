/**
 * Standalone scout server — composition root.
 *
 * Câble l'env (config) → DB → factories → app Fastify, monte le produit lead
 * générique sous /api/leads, sert le frontend buildé en statique, et écoute.
 *
 * Usage : `npm run dev` (tsx watch) ou `npm start` (node dist/serve.js).
 */
import { config } from "./config.js";
import { createScoutDb } from "./db.js";
import { buildScoutApp } from "./build-app.js";
import { makeApiTokens } from "./services/api-tokens.js";
import { makeClaudeMd } from "./services/claude-md.js";
import { makeProviderCalls } from "./services/provider-calls.js";
import { makeLeads } from "./services/leads.js";
import { makeClaimable } from "./services/claimable.js";
import { makeEntityLog } from "./services/entity-log.js";
import { makeLeadsRoutes } from "./routes/leads.js";
import { makeAdminRoutes } from "./routes/admin.js";

export async function buildApp() {
  const sql = createScoutDb(config.databaseUrl);
  const apiTokens = makeApiTokens(sql, { prefix: config.apiTokenPrefix });
  const claudeMd = makeClaudeMd(sql);
  const providerCalls = makeProviderCalls(sql);

  // Produit lead générique : service CRUD + verrou + journal, câblés sur sql.
  const leads = makeLeads(sql);
  const lock = makeClaimable(sql, { table: "leads", keyColumn: "id" });
  const logs = makeEntityLog(sql, { table: "lead_logs", keyColumn: "lead_id" });

  const app = await buildScoutApp({
    apiTitle: "scout API",
    apiVersion: "0.2.0",
    auth: {
      endpoint: config.logto.endpoint,
      audience: config.logto.audience,
      enabled: config.logto.enabled,
      tokenVerifier: apiTokens.verify,
    },
    missions: [],
    corePlugins: [
      { prefix: "/api/leads", plugin: makeLeadsRoutes({ leads, lock, logs }) },
      { prefix: "/api/admin", plugin: makeAdminRoutes({ apiTokens, claudeMd, providerCalls }) },
    ],
    staticDir: config.staticDir,
  });

  return app;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    app.log.info(
      `scout listening on :${config.port} — auth=${config.logto.enabled ? "logto" : "DEV-BYPASS"}` +
        `${config.staticDir ? " — serving frontend" : " — API only"}`,
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
