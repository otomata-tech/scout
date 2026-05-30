/**
 * Access control helpers (générique).
 * - Lit les rôles depuis les claims JWT si présents, sinon fallback Logto
 *   Management API (cachée).
 * - Fournit un preHandler Fastify `requireAdmin` pour les routes admin.
 *
 * Injection : le nom du rôle admin, le flag `enabled` (dev bypass) et la fn
 * `getUserInfo` (cf. {@link makeLogtoClient}) sont passés par le consommateur
 * via {@link makeAccess}.
 */
import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserInfo } from "./logto.js";

declare module "fastify" {
  interface FastifyRequest {
    accessRoles?: string[];
    accessEmail?: string | null;
    accessName?: string | null;
  }
}

export interface AccessConfig {
  /** Nom du rôle admin (mission-spécifique, ex "blitz:admin"). */
  adminRole: string;
  /** Auth active ? `false` → dev bypass (caller traité comme admin). */
  enabled: boolean;
  /** Résolution roles/email/name depuis le sub (cf makeLogtoClient().getUserInfo). */
  getUserInfo: (sub: string) => Promise<UserInfo>;
}

export function getUserSub(request: FastifyRequest): string {
  return (request.user?.sub as string) ?? "";
}

export function makeAccess(config: AccessConfig) {
  const ADMIN_ROLE = config.adminRole;

  async function loadAccess(
    request: FastifyRequest,
  ): Promise<{ roles: string[]; email: string | null; name: string | null }> {
    if (request.accessRoles !== undefined) {
      return {
        roles: request.accessRoles,
        email: request.accessEmail ?? null,
        name: request.accessName ?? null,
      };
    }

    // Dev bypass — pretend caller is admin so admin UI is testable locally
    if (!config.enabled) {
      const out = { roles: [ADMIN_ROLE], email: "dev@bypass.local", name: "Dev Bypass" };
      request.accessRoles = out.roles;
      request.accessEmail = out.email;
      request.accessName = out.name;
      return out;
    }

    const sub = getUserSub(request);
    if (!sub) return { roles: [], email: null, name: null };

    // Try JWT-embedded claims first (cheap)
    const jwtRoles = (request.user as { roles?: string[] } | undefined)?.roles;
    const jwtEmail = (request.user as { email?: string } | undefined)?.email ?? null;
    const jwtName = (request.user as { name?: string } | undefined)?.name ?? null;

    let roles = jwtRoles;
    let email = jwtEmail;
    let name = jwtName;
    if (!roles || !email || !name) {
      const info = await config.getUserInfo(sub);
      roles = roles ?? info.roles;
      email = email ?? info.email;
      name = name ?? info.name;
    }

    request.accessRoles = roles;
    request.accessEmail = email;
    request.accessName = name;
    return { roles, email, name };
  }

  async function getRoles(request: FastifyRequest): Promise<string[]> {
    return (await loadAccess(request)).roles;
  }

  async function getEmail(request: FastifyRequest): Promise<string | null> {
    return (await loadAccess(request)).email;
  }

  async function getName(request: FastifyRequest): Promise<string | null> {
    return (await loadAccess(request)).name;
  }

  async function isAdmin(request: FastifyRequest): Promise<boolean> {
    const roles = await getRoles(request);
    return roles.includes(ADMIN_ROLE);
  }

  /** Fastify preHandler that rejects non-admin requests with 403. */
  async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!(await isAdmin(request))) {
      return reply.code(403).send({ error: "Admin access required" });
    }
  }

  return { ADMIN_ROLE, getUserSub, getRoles, getEmail, getName, isAdmin, requireAdmin };
}
