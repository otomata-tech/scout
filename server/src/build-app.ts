import Fastify, { type FastifyInstance, type FastifyPluginAsync } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from "fastify-type-provider-zod";
import { makeAuthPreHandler, type LogtoAuthConfig } from "./auth.js";
import { cacheStats, invalidate } from "./cache.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export interface MissionPlugin {
  id: string;
  plugin: FastifyPluginAsync;
}

export interface ScoutAppConfig {
  apiTitle: string;
  apiVersion?: string;
  missions: MissionPlugin[];
  auth: LogtoAuthConfig;
  isTest?: boolean;
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

  const authPreHandler = makeAuthPreHandler(config.auth);

  // Authenticated tree
  await app.register(async (scoped) => {
    scoped.addHook("preHandler", authPreHandler);

    // Mission plugins under /api/missions/<id>
    for (const m of config.missions) {
      await scoped.register(m.plugin, { prefix: `/api/missions/${m.id}` });
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

  return app;
}
