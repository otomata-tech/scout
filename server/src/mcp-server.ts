/**
 * Generic MCP server builder.
 *
 * Removes the @modelcontextprotocol SDK boilerplate (`new McpServer(...)` +
 * capabilities + sequential tool registration) so a mission only provides its
 * name/version, eager instructions, and a list of tool-registration functions.
 *
 * The tools themselves stay mission-specific — each `register` callback receives
 * the live server and calls `server.tool(...)`. scout knows nothing about what
 * those tools do.
 *
 * Pairs with {@link makeMcpRoutes} (./mcp), which exposes the built server over
 * Streamable HTTP. Pass `buildServer: () => buildScoutMcpServer({...})`.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** A function that registers one or more tools on the MCP server. */
export type McpToolRegistrar = (server: McpServer) => void;

export interface ScoutMcpServerConfig {
  /** Server name advertised in `initialize` (e.g. "blitz-mcp"). */
  name: string;
  /** Server version advertised in `initialize`. */
  version: string;
  /**
   * Eager instructions returned at `initialize` — keep short (~500 chars).
   * Heavy doctrine should load lazily via a dedicated tool (e.g. get_claude_md).
   */
  instructions: string;
  /** Tool-registration callbacks, run in order against the fresh server. */
  register: McpToolRegistrar[];
}

export function buildScoutMcpServer(config: ScoutMcpServerConfig): McpServer {
  const server = new McpServer(
    { name: config.name, version: config.version },
    { capabilities: { tools: {} }, instructions: config.instructions },
  );
  for (const register of config.register) {
    register(server);
  }
  return server;
}
