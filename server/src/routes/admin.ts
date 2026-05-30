/**
 * Generic admin routes for the standalone scout app.
 *
 * Plugin Fastify paramétré, monté sous /api/admin dans l'arbre authentifié :
 *   - api-tokens : tokens API personnels (par user) — create / list / revoke
 *   - claude-md  : doctrine MCP (settings.claude_md) — get / put
 *   - provider-calls : stats + appels récents des providers d'enrichissement
 *   - me         : identité courante (depuis le token)
 *
 * Les services concrets sont injectés (déjà câblés sur `sql`). Pas de gating de
 * rôle ici : l'arbre est déjà authentifié. Le gating admin (rôle Logto) est un
 * raffinement à brancher via un preHandler quand l'instance a une config Logto.
 */
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { makeApiTokens } from "../services/api-tokens.js";
import type { makeClaudeMd } from "../services/claude-md.js";
import type { makeProviderCalls } from "../services/provider-calls.js";

export interface AdminRoutesDeps {
  apiTokens: ReturnType<typeof makeApiTokens>;
  claudeMd: ReturnType<typeof makeClaudeMd>;
  providerCalls: ReturnType<typeof makeProviderCalls>;
}

export function makeAdminRoutes(deps: AdminRoutesDeps): FastifyPluginAsync {
  const { apiTokens, claudeMd, providerCalls } = deps;

  return async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    const tags = ["admin"];

    // ── Identité courante ──────────────────────────────────
    app.get(
      "/me",
      { schema: { tags, response: { 200: z.object({ sub: z.string(), name: z.string().nullable() }) } } },
      async ({ user }) => ({ sub: user?.sub ?? "", name: (user?.name as string | undefined) ?? null }),
    );

    // ── API tokens (par user) ──────────────────────────────
    app.get(
      "/api-tokens",
      {
        schema: {
          tags,
          response: {
            200: z.array(z.object({
              id: z.number(),
              name: z.string(),
              lastUsedAt: z.string().nullable(),
              expiresAt: z.string().nullable(),
              revokedAt: z.string().nullable(),
              createdAt: z.string(),
            })),
          },
        },
      },
      async ({ user }) => {
        const tokens = await apiTokens.listByUser(user?.sub ?? "");
        return tokens.map(({ userSub: _userSub, ...t }) => t);
      },
    );

    app.post(
      "/api-tokens",
      {
        schema: {
          tags,
          body: z.object({ name: z.string().min(1).max(100) }),
          response: { 201: z.object({ id: z.number(), token: z.string() }) },
        },
      },
      async ({ user, body }, reply) => {
        reply.code(201);
        return apiTokens.create(user?.sub ?? "", body.name);
      },
    );

    app.delete(
      "/api-tokens/:id",
      {
        schema: {
          tags,
          params: z.object({ id: z.coerce.number().int() }),
          response: { 200: z.object({ revoked: z.boolean() }) },
        },
      },
      async ({ user, params }) => ({ revoked: await apiTokens.revoke(params.id, user?.sub ?? "") }),
    );

    // ── Doctrine MCP (claude_md) ───────────────────────────
    app.get(
      "/claude-md",
      { schema: { tags, response: { 200: z.object({ content: z.string() }) } } },
      async () => {
        try {
          return { content: await claudeMd.getClaudeMd() };
        } catch {
          return { content: "" }; // row absente → éditeur vide plutôt que 500
        }
      },
    );

    app.put(
      "/claude-md",
      {
        schema: {
          tags,
          body: z.object({ content: z.string().min(1) }),
          response: { 200: z.object({ ok: z.boolean(), length: z.number() }) },
        },
      },
      async ({ user, body }) => {
        await claudeMd.setClaudeMd(body.content, user?.sub ?? "unknown");
        return { ok: true, length: body.content.length };
      },
    );

    // ── Coûts providers d'enrichissement ───────────────────
    app.get(
      "/provider-calls/stats",
      {
        schema: {
          tags,
          querystring: z.object({ days: z.coerce.number().min(1).max(365).optional() }),
          response: {
            200: z.object({
              stats: z.array(z.object({
                provider: z.string(),
                totalCalls: z.number(),
                successCalls: z.number(),
                totalPhones: z.number(),
                totalEmails: z.number(),
                totalCredits: z.number().nullable(),
                hitRate: z.number(),
              })),
            }),
          },
        },
      },
      async ({ query }) => ({ stats: await providerCalls.stats(query.days) }),
    );

    app.get(
      "/provider-calls/recent",
      {
        schema: {
          tags,
          querystring: z.object({ limit: z.coerce.number().min(1).max(200).optional() }),
          response: {
            200: z.object({
              calls: z.array(z.object({
                id: z.number(),
                provider: z.string(),
                siren: z.string().nullable(),
                contactId: z.number().nullable(),
                linkedinSlug: z.string().nullable(),
                success: z.boolean(),
                phonesFound: z.number(),
                emailsFound: z.number(),
                creditsUsed: z.number().nullable(),
                error: z.string().nullable(),
                createdAt: z.string(),
              })),
            }),
          },
        },
      },
      async ({ query }) => ({ calls: await providerCalls.recent(query.limit) }),
    );
  };
}
