/**
 * Logto Management API wrapper (générique).
 *
 * - Cache le token M2M en mémoire (Logto OSS ne supporte pas les claims JWT
 *   custom, donc on hit l'API pour roles / email / name).
 * - Cache user-info : 60s TTL par sub.
 *
 * Injection : pas d'accès à `process.env` ni à un singleton config — le
 * consommateur passe sa config Logto via {@link makeLogtoClient}. Chaque client
 * a ses propres caches (token M2M + user-info).
 */

export interface LogtoMgmtConfig {
  /** Base Logto, ex https://auth.oto.zone */
  endpoint: string;
  /** App M2M (client credentials) pour la Management API. */
  m2mAppId: string;
  m2mAppSecret: string;
  /** Organisation Logto (optionnelle) : scope les listes/membership users. */
  orgId?: string;
  /** User-Agent envoyé à Logto (défaut "scout"). */
  userAgent?: string;
}

export interface LogtoUser {
  id: string;
  username: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  name: string | null;
  avatar: string | null;
  customData: Record<string, unknown> | null;
  identities: Record<string, unknown> | null;
  lastSignInAt: number | null;
  createdAt: number;
}

export interface UserInfo {
  email: string | null;
  name: string | null;
  roles: string[];
}

interface MgmtToken {
  accessToken: string;
  expiresAt: number;
}

interface CachedUserInfo extends UserInfo {
  ts: number;
}

const USER_CACHE_TTL_MS = 60_000;

export function makeLogtoClient(config: LogtoMgmtConfig) {
  const ua = config.userAgent ?? "scout";
  let mgmtToken: MgmtToken | null = null;
  const userCache = new Map<string, CachedUserInfo>();

  async function getMgmtToken(): Promise<string> {
    if (mgmtToken && mgmtToken.expiresAt > Date.now()) return mgmtToken.accessToken;

    const basic = Buffer.from(`${config.m2mAppId}:${config.m2mAppSecret}`).toString("base64");
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      resource: "https://default.logto.app/api",
      scope: "all",
    });

    const res = await fetch(`${config.endpoint}/oidc/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
        "User-Agent": ua,
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Logto M2M token failed: ${res.status} ${text}`);
    }

    const json = (await res.json()) as { access_token: string; expires_in: number };
    mgmtToken = {
      accessToken: json.access_token,
      expiresAt: Date.now() + (json.expires_in - 60) * 1000,
    };
    return json.access_token;
  }

  async function mgmt<T = unknown>(method: string, path: string, payload?: unknown): Promise<T | null> {
    const token = await getMgmtToken();
    const res = await fetch(`${config.endpoint}/api${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": ua,
      },
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    });
    if (res.status === 204) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Logto Management API ${method} ${path} → ${res.status}: ${text}`);
    }
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  }

  async function getUserInfo(sub: string): Promise<UserInfo> {
    const cached = userCache.get(sub);
    if (cached && Date.now() - cached.ts < USER_CACHE_TTL_MS) {
      return { email: cached.email, name: cached.name, roles: cached.roles };
    }
    const user = await mgmt<LogtoUser>("GET", `/users/${sub}`);
    const roles = await mgmt<Array<{ id: string; name: string }>>("GET", `/users/${sub}/roles`) ?? [];
    const info: UserInfo = {
      email: user?.primaryEmail ?? null,
      name: user?.name ?? null,
      roles: roles.map((r) => r.name),
    };
    userCache.set(sub, { ...info, ts: Date.now() });
    return info;
  }

  function clearUserCache(sub?: string) {
    if (sub) userCache.delete(sub);
    else userCache.clear();
  }

  async function listUsers(): Promise<LogtoUser[]> {
    if (config.orgId) {
      return (await mgmt<LogtoUser[]>("GET", `/organizations/${config.orgId}/users?page=1&pageSize=200`)) ?? [];
    }
    return (await mgmt<LogtoUser[]>("GET", "/users?page=1&pageSize=200")) ?? [];
  }

  async function findUserByEmail(email: string): Promise<LogtoUser | null> {
    const lower = email.trim().toLowerCase();
    // mode=exact requis quand search est combiné à searchFields, sinon Logto renvoie
    // 400 "Only one search value is allowed when search mode is not `exact`".
    const users = await mgmt<LogtoUser[]>("GET", `/users?search=${encodeURIComponent(lower)}&searchFields=primaryEmail&mode=exact`);
    return users?.find((u) => u.primaryEmail?.toLowerCase() === lower) ?? null;
  }

  async function findOrCreateUser(email: string, name?: string): Promise<LogtoUser> {
    const existing = await findUserByEmail(email);
    if (existing) return existing;
    // Logto's guard rejects `name: null` (expects a string); omit the field when absent.
    const trimmedName = name?.trim();
    const created = await mgmt<LogtoUser>("POST", "/users", {
      primaryEmail: email.trim().toLowerCase(),
      ...(trimmedName ? { name: trimmedName } : {}),
    });
    if (!created) throw new Error("Logto POST /users returned no body");
    return created;
  }

  async function deleteUser(sub: string): Promise<void> {
    await mgmt("DELETE", `/users/${sub}`);
    clearUserCache(sub);
  }

  async function getUserRoles(sub: string): Promise<string[]> {
    const info = await getUserInfo(sub);
    return info.roles;
  }

  /**
   * Fetch all user subs that have a given role — 1 API call instead of N.
   */
  async function listUserSubsWithRole(roleId: string): Promise<Set<string>> {
    const users = await mgmt<Array<{ id: string }>>("GET", `/roles/${roleId}/users?page=1&pageSize=200`);
    return new Set((users ?? []).map((u) => u.id));
  }

  async function assignRoleToUser(sub: string, roleId: string): Promise<void> {
    await mgmt("POST", `/users/${sub}/roles`, { roleIds: [roleId] });
    clearUserCache(sub);
  }

  async function removeRoleFromUser(sub: string, roleId: string): Promise<void> {
    await mgmt("DELETE", `/users/${sub}/roles/${roleId}`);
    clearUserCache(sub);
  }

  async function addUserToOrg(sub: string): Promise<void> {
    if (!config.orgId) return;
    await mgmt("POST", `/organizations/${config.orgId}/users`, { userIds: [sub] });
  }

  async function removeUserFromOrg(sub: string): Promise<void> {
    if (!config.orgId) return;
    await mgmt("DELETE", `/organizations/${config.orgId}/users/${sub}`);
  }

  /**
   * Generate a Logto one-time token usable in an /invite landing page to sign
   * the user in directly. Single-use, valid 7 days by default. Returns null if
   * the endpoint isn't available on this Logto version (caller falls back to a
   * plain sign-in URL).
   */
  async function createOneTimeToken(email: string): Promise<string | null> {
    try {
      const resp = await mgmt<{ token: string }>("POST", "/one-time-tokens", {
        email: email.trim().toLowerCase(),
        expiresIn: 7 * 24 * 3600,
        contextProtected: { type: "SignIn" },
      });
      return resp?.token ?? null;
    } catch {
      return null;
    }
  }

  return {
    getUserInfo,
    clearUserCache,
    listUsers,
    findUserByEmail,
    findOrCreateUser,
    deleteUser,
    getUserRoles,
    listUserSubsWithRole,
    assignRoleToUser,
    removeRoleFromUser,
    addUserToOrg,
    removeUserFromOrg,
    createOneTimeToken,
  };
}

export type LogtoClient = ReturnType<typeof makeLogtoClient>;
