/**
 * Route MCP générique — expose un serveur MCP via Streamable HTTP (stateless).
 *
 *  POST   /mcp                                      — JSON-RPC MCP (initialize, tools/list, tools/call)
 *  GET    /mcp                                      — SSE notifications (stateless: idem POST)
 *  DELETE /mcp                                      — idem
 *  GET    /.well-known/oauth-protected-resource     — RFC 9728 metadata pour découverte OAuth
 *  GET    /.well-known/oauth-protected-resource/mcp — variante avec suffixe ressource
 *
 * Auth : Bearer JWT Logto. Si `logtoEndpoint` est vide → bypass (dev).
 * Sur 401 on renvoie `WWW-Authenticate: Bearer resource_metadata="…"` pour
 * amorcer le flow OAuth côté client MCP (Claude Web custom connector).
 *
 * Le serveur MCP lui-même (instructions + tools) reste mission-spécifique : le
 * consommateur passe une factory `buildServer` (cf McpServer du SDK MCP).
 */
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface McpRoutesConfig {
  /** Factory qui construit un serveur MCP (instructions + tools) à chaque requête. */
  buildServer: () => McpServer;
  /** Base URL publique du service, ex https://blitz.dev */
  publicBaseUrl: string;
  /** Endpoint Logto. Vide/undefined → bypass auth (dev). */
  logtoEndpoint?: string;
  /** Resource indicator (RFC 8707). Défaut `${publicBaseUrl}/mcp`. */
  audience?: string;
}

export function makeMcpRoutes(cfg: McpRoutesConfig): FastifyPluginAsync {
  const PUBLIC_BASE_URL = cfg.publicBaseUrl;
  // Resource indicator (RFC 8707) = URL du MCP lui-même. Distinct de l'API REST.
  const MCP_AUDIENCE = cfg.audience || `${PUBLIC_BASE_URL}/mcp`;
  const endpoint = cfg.logtoEndpoint ?? "";

  const JWKS = endpoint
    ? createRemoteJWKSet(new URL(`${endpoint}/oidc/jwks`))
    : null;

  function challenge(error?: string): string {
    const params = [
      `resource_metadata="${PUBLIC_BASE_URL}/.well-known/oauth-protected-resource"`,
    ];
    if (error) params.unshift(`error="${error}"`);
    return `Bearer ${params.join(", ")}`;
  }

  async function verifyBearer(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
    // Dev bypass — pas de Logto configuré
    if (!JWKS || !endpoint) return true;

    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      reply.header("WWW-Authenticate", challenge());
      reply.code(401).send({ error: "unauthorized" });
      return false;
    }
    try {
      await jwtVerify(header.slice(7), JWKS, {
        issuer: `${endpoint}/oidc`,
        audience: MCP_AUDIENCE,
      });
      return true;
    } catch {
      reply.header("WWW-Authenticate", challenge("invalid_token"));
      reply.code(401).send({ error: "invalid_token" });
      return false;
    }
  }

  return async (fastify) => {
    const resourceMetadata = {
      resource: MCP_AUDIENCE,
      authorization_servers: endpoint ? [`${endpoint}/oidc`] : [],
      bearer_methods_supported: ["header"],
      scopes_supported: [],
      resource_documentation: `${PUBLIC_BASE_URL}/api/docs`,
    };

    fastify.get("/.well-known/oauth-protected-resource", async () => resourceMetadata);
    fastify.get("/.well-known/oauth-protected-resource/mcp", async () => resourceMetadata);

    const handleMcp = async (request: FastifyRequest, reply: FastifyReply) => {
      if (!(await verifyBearer(request, reply))) return;

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      const server = cfg.buildServer();
      await server.connect(transport);

      request.raw.on("close", () => {
        transport.close().catch(() => {});
        server.close().catch(() => {});
      });

      reply.hijack();
      await transport.handleRequest(request.raw, reply.raw, request.body);
    };

    fastify.post("/mcp", handleMcp);
    fastify.get("/mcp", handleMcp);
    fastify.delete("/mcp", handleMcp);
  };
}
