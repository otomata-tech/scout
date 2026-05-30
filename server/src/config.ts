/**
 * Env config for the **standalone scout server** (composition root).
 *
 * La bibliothèque scout ne lit jamais `process.env` : c'est ce fichier, propre à
 * l'app autonome, qui le fait et injecte ensuite tout dans les factories. Un
 * consommateur « châssis » (ex. blitz) ignore ce module et fournit sa propre
 * config.
 */
import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 8100),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL,

  /** Build frontend servi en statique (mono-process). Absent → API seule. */
  staticDir: process.env.STATIC_DIR,

  logto: {
    endpoint: process.env.LOGTO_ENDPOINT ?? "",
    audience: process.env.LOGTO_AUDIENCE ?? "",
    // false → bypass dev (request.user = { sub: "dev-bypass" }) si LOGTO_* vides.
    enabled: Boolean(process.env.LOGTO_ENDPOINT && process.env.LOGTO_AUDIENCE),
  },

  apiTokenPrefix: process.env.API_TOKEN_PREFIX ?? "scout_",
};

export type Config = typeof config;
