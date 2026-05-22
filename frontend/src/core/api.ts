/**
 * Thin fetch helper with auth header injection + cache-header capture.
 * Each mission's api.ts wraps this with typed routes.
 */

export interface CacheInfo {
  hit: boolean;
  ageSeconds: number;
  cachedAt: Date | null;
}

export type GetAuthToken = () => Promise<string | null>;

export interface ScoutApiClient {
  call: <T>(path: string, init?: RequestInit) => Promise<T>;
  getLastCache: () => CacheInfo;
}

export function createApiClient(getToken?: GetAuthToken): ScoutApiClient {
  let lastCache: CacheInfo = { hit: false, ageSeconds: 0, cachedAt: null };

  async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    if (getToken) {
      const token = await getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    const res = await fetch(path, { ...init, headers });

    const xCache = res.headers.get("x-cache");
    if (xCache) {
      const cachedAt = res.headers.get("x-cache-at");
      lastCache = {
        hit: xCache === "HIT",
        ageSeconds: Number(res.headers.get("x-cache-age") ?? 0),
        cachedAt: cachedAt ? new Date(cachedAt) : null,
      };
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
    return (await res.json()) as T;
  }

  return { call, getLastCache: () => lastCache };
}

/**
 * Default API base path for a mission.
 * Mission's api.ts builds URLs like `${missionApiBase("movinmotion")}/stats/stages`.
 */
export function missionApiBase(missionId: string): string {
  return `/api/missions/${missionId}`;
}

export async function invalidateCache(
  client: ScoutApiClient,
  prefix?: string
): Promise<{ invalidated: number }> {
  return client.call<{ invalidated: number }>(
    `/api/cache/invalidate${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`,
    { method: "POST" }
  );
}
