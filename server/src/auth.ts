import { createRemoteJWKSet, jwtVerify } from "jose";
import type { FastifyReply, FastifyRequest } from "fastify";

export interface LogtoAuthConfig {
  endpoint: string;          // e.g. https://auth.oto.zone
  audience: string;          // e.g. https://api.<project>.oto.zone
  enabled?: boolean;         // false → dev bypass (request.user = { sub: "dev-bypass" })
}

declare module "fastify" {
  interface FastifyRequest {
    user?: { sub: string; [k: string]: unknown };
  }
}

/**
 * Returns a Fastify preHandler that verifies a Logto-issued JWT.
 * When `enabled: false`, populates request.user with a bypass identity (dev mode).
 *
 * Usage :
 *   app.addHook("preHandler", makeAuthPreHandler({ endpoint, audience, enabled: true }));
 */
export function makeAuthPreHandler(config: LogtoAuthConfig) {
  const enabled = config.enabled ?? true;

  if (!enabled) {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
      request.user = { sub: "dev-bypass" };
    };
  }

  if (!config.endpoint || !config.audience) {
    throw new Error("Logto auth enabled but endpoint or audience missing");
  }

  const jwks = createRemoteJWKSet(new URL(`${config.endpoint}/oidc/jwks`));
  const issuer = `${config.endpoint}/oidc`;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const token = auth.slice(7);
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience: config.audience,
      });
      request.user = payload as { sub: string };
    } catch {
      return reply.code(401).send({ error: "Invalid token" });
    }
  };
}
