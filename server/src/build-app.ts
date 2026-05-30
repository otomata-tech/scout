import Fastify, { type FastifyInstance, type FastifyPluginAsync } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from "fastify-type-provider-zod";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { makeAuthPreHandler, type LogtoAuthConfig } from "./auth.js";
import { cacheStats, invalidate } from "./cache.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export interface MissionPlugin {
  id: string;
  plugin: FastifyPluginAsync;
}

/** Plugin générique monté dans l'arbre authentifié à un préfixe libre (ex. /api/leads). */
export interface CorePlugin {
  prefix: string;
  plugin: FastifyPluginAsync;
}

export interface ScoutAppConfig {
  apiTitle: string;
  apiVersion?: string;
  missions: MissionPlugin[];
  auth: LogtoAuthConfig;
  isTest?: boolean;
  /** Plugins cœur (non-mission) montés sous /api/* dans l'arbre authentifié. */
  corePlugins?: CorePlugin[];
  /**
   * Répertoire du build frontend à servir en statique (mono-process SaaS).
   * Fallback SPA : toute route non-`/api` renvoie index.html. Absent → API seule.
   */
  staticDir?: string;
}

/**
 * Build a Fastify app with scout's core plugins :
 * - CORS, swagger, swagger-ui (/api/docs)
 * - Public health endpoint (/api/health) — overridden by consumer if needed
 * - Authenticated /api/missions/<id>/* routes (each mission registers its plugin)
 * - Authenticated /api/cache/{stats,invalidate} for cache control
 */
export async function buildScoutApp(config: ScoutAppConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.isTest ? false : { level: "info" } });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: true });

  await app.register(swagger, {
    openapi: {
      info: {
        title: config.apiTitle,
        version: config.apiVersion ?? "0.1.0",
        description: "Built on scout — generic lead-enrichment shell.",
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: "/api/docs" });

  // Public health endpoint (no auth) — liveness probe for the SaaS.
  app.withTypeProvider<ZodTypeProvider>().get(
    "/api/health",
    { schema: { tags: ["health"], response: { 200: z.object({ ok: z.boolean() }) } } },
    async () => ({ ok: true }),
  );

  const authPreHandler = makeAuthPreHandler(config.auth);

  // Authenticated tree
  await app.register(async (scoped) => {
    scoped.addHook("preHandler", authPreHandler);

    // Mission plugins under /api/missions/<id>
    for (const m of config.missions) {
      await scoped.register(m.plugin, { prefix: `/api/missions/${m.id}` });
    }

    // Core (non-mission) plugins under /api/* — e.g. the generic /api/leads product.
    for (const c of config.corePlugins ?? []) {
      await scoped.register(c.plugin, { prefix: c.prefix });
    }

    // Cache control (cross-mission)
    const typed = scoped.withTypeProvider<ZodTypeProvider>();
    typed.get(
      "/api/cache/stats",
      {
        schema: {
          tags: ["cache"],
          response: {
            200: z.object({
              count: z.number(),
              entries: z.array(
                z.object({
                  key: z.string(),
                  age_seconds: z.number(),
                  expires_in_seconds: z.number(),
                })
              ),
            }),
          },
        },
      },
      async () => cacheStats()
    );
    typed.post(
      "/api/cache/invalidate",
      {
        schema: {
          tags: ["cache"],
          querystring: z.object({ prefix: z.string().optional() }),
          response: { 200: z.object({ invalidated: z.number() }) },
        },
      },
      async ({ query }) => ({ invalidated: invalidate(query.prefix) })
    );
  });

  // Static frontend (mono-process SaaS) : serve the built SPA + history fallback.
  if (config.staticDir && existsSync(config.staticDir)) {
    const staticDir = config.staticDir;
    const fastifyStatic = (await import("@fastify/static")).default;
    await app.register(fastifyStatic, { root: staticDir, wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/api")) return reply.code(404).send({ error: "not-found" });
      return reply.sendFile("index.html", staticDir);
    });
  }

  return app;
}
