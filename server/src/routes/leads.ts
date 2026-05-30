/**
 * Generic lead routes (cœur du produit scout standalone).
 *
 * Plugin Fastify paramétré : CRUD sur `leads` + verrou exclusif (claimable) +
 * journal (entity-log). Aucune connaissance du domaine — le consommateur injecte
 * les services déjà câblés sur son `sql`. Monté par défaut sous `/api/leads` par
 * le serveur standalone ; ignoré par les consommateurs purement « châssis ».
 */
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { makeLeads } from "../services/leads.js";
import type { makeClaimable } from "../services/claimable.js";
import type { makeEntityLog } from "../services/entity-log.js";

export interface LeadsRoutesDeps {
  leads: ReturnType<typeof makeLeads>;
  lock: ReturnType<typeof makeClaimable>;
  logs: ReturnType<typeof makeEntityLog>;
}

const leadOut = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string(),
  source: z.string().nullable(),
  data: z.record(z.unknown()),
  claimedBy: z.string().nullable(),
  claimedByName: z.string().nullable(),
  claimedAt: z.string().nullable(),
  createdAt: z.string(),
  createdBy: z.string().nullable(),
  updatedAt: z.string(),
  updatedBy: z.string().nullable(),
});

const logOut = z.object({
  id: z.number(),
  kind: z.string(),
  content: z.string(),
  metadata: z.record(z.unknown()).nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.string(),
});

export function makeLeadsRoutes(deps: LeadsRoutesDeps): FastifyPluginAsync {
  const { leads, lock, logs } = deps;

  return async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    const tags = ["leads"];

    app.get(
      "/",
      {
        schema: {
          tags,
          querystring: z.object({
            status: z.string().optional(),
            source: z.string().optional(),
            q: z.string().optional(),
            claimed: z.coerce.boolean().optional(),
            limit: z.coerce.number().min(1).max(500).optional(),
            offset: z.coerce.number().min(0).optional(),
          }),
          response: { 200: z.object({ leads: z.array(leadOut) }) },
        },
      },
      async ({ query }) => ({ leads: await leads.list(query) }),
    );

    app.post(
      "/",
      {
        schema: {
          tags,
          body: z.object({
            name: z.string().min(1),
            status: z.string().optional(),
            source: z.string().nullable().optional(),
            data: z.record(z.unknown()).optional(),
          }),
          response: { 200: leadOut },
        },
      },
      async ({ body, user }) => leads.create({ ...body, createdBy: user?.sub ?? null }),
    );

    app.get(
      "/:id",
      {
        schema: {
          tags,
          params: z.object({ id: z.coerce.number() }),
          response: { 200: leadOut, 404: z.object({ error: z.string() }) },
        },
      },
      async ({ params }, reply) => {
        const lead = await leads.get(params.id);
        if (!lead) return reply.code(404).send({ error: "lead-not-found" });
        return lead;
      },
    );

    app.patch(
      "/:id",
      {
        schema: {
          tags,
          params: z.object({ id: z.coerce.number() }),
          body: z.object({
            name: z.string().min(1).optional(),
            status: z.string().optional(),
            source: z.string().nullable().optional(),
            data: z.record(z.unknown()).optional(),
          }),
          response: { 200: leadOut, 404: z.object({ error: z.string() }) },
        },
      },
      async ({ params, body, user }, reply) => {
        const lead = await leads.update(params.id, { ...body, updatedBy: user?.sub ?? null });
        if (!lead) return reply.code(404).send({ error: "lead-not-found" });
        return lead;
      },
    );

    app.delete(
      "/:id",
      {
        schema: {
          tags,
          params: z.object({ id: z.coerce.number() }),
          response: { 200: z.object({ deleted: z.boolean() }) },
        },
      },
      async ({ params }) => ({ deleted: await leads.remove(params.id) }),
    );

    // Verrou exclusif multi-utilisateur
    app.post(
      "/:id/claim",
      {
        schema: {
          tags,
          params: z.object({ id: z.coerce.number() }),
          response: { 200: z.object({ ok: z.boolean(), lead: leadOut.nullable() }) },
        },
      },
      async ({ params, user }) => {
        const by = user?.sub ?? "anonymous";
        const byName = (user?.name as string | undefined) ?? null;
        const ok = await lock.claim(params.id, by, byName);
        if (ok) {
          await logs.append({ entityId: params.id, kind: "claim", content: `Lead réclamé par ${byName ?? by}`, createdBy: by });
        }
        return { ok, lead: await leads.get(params.id) };
      },
    );

    app.post(
      "/:id/release",
      {
        schema: {
          tags,
          params: z.object({ id: z.coerce.number() }),
          response: { 200: z.object({ ok: z.boolean(), lead: leadOut.nullable() }) },
        },
      },
      async ({ params, user }) => {
        const by = user?.sub ?? "anonymous";
        const ok = await lock.release(params.id, by);
        if (ok) await logs.append({ entityId: params.id, kind: "release", content: "Lead libéré", createdBy: by });
        return { ok, lead: await leads.get(params.id) };
      },
    );

    // Journal append-only
    app.get(
      "/:id/logs",
      {
        schema: {
          tags,
          params: z.object({ id: z.coerce.number() }),
          response: { 200: z.object({ logs: z.array(logOut) }) },
        },
      },
      async ({ params }) => ({ logs: await logs.listByEntity(params.id) }),
    );

    app.post(
      "/:id/logs",
      {
        schema: {
          tags,
          params: z.object({ id: z.coerce.number() }),
          body: z.object({ kind: z.string(), content: z.string(), metadata: z.record(z.unknown()).optional() }),
          response: { 200: logOut },
        },
      },
      async ({ params, body, user }) =>
        logs.append({ entityId: params.id, kind: body.kind, content: body.content, metadata: body.metadata, createdBy: user?.sub ?? null }),
    );
  };
}
