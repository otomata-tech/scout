/**
 * In-memory TTL cache. Process-local, resets on reboot.
 * Sufficient for protecting upstream APIs (Zoho, HubSpot…) from rate limiting
 * when the same query is hit repeatedly across users in a short window.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
  cachedAt: number;
}

const store = new Map<string, Entry<unknown>>();

export interface CacheMeta {
  hit: boolean;
  ageSeconds: number;
  cachedAt: string;
}

export async function memoCached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<{ value: T; meta: CacheMeta }> {
  const now = Date.now();
  const existing = store.get(key) as Entry<T> | undefined;
  if (existing && existing.expiresAt > now) {
    return {
      value: existing.value,
      meta: {
        hit: true,
        ageSeconds: Math.round((now - existing.cachedAt) / 1000),
        cachedAt: new Date(existing.cachedAt).toISOString(),
      },
    };
  }
  const value = await fn();
  store.set(key, { value, cachedAt: now, expiresAt: now + ttlSeconds * 1000 });
  return {
    value,
    meta: {
      hit: false,
      ageSeconds: 0,
      cachedAt: new Date(now).toISOString(),
    },
  };
}

export function invalidate(prefix?: string): number {
  if (!prefix) {
    const n = store.size;
    store.clear();
    return n;
  }
  let n = 0;
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) {
      store.delete(k);
      n++;
    }
  }
  return n;
}

export function cacheStats() {
  const now = Date.now();
  const entries = [...store.entries()].map(([key, e]) => ({
    key,
    age_seconds: Math.round((now - e.cachedAt) / 1000),
    expires_in_seconds: Math.max(0, Math.round((e.expiresAt - now) / 1000)),
  }));
  return { count: store.size, entries };
}

export function applyCacheHeaders(
  reply: { header: (k: string, v: string) => void },
  meta: CacheMeta
) {
  reply.header("X-Cache", meta.hit ? "HIT" : "MISS");
  reply.header("X-Cache-Age", String(meta.ageSeconds));
  reply.header("X-Cache-At", meta.cachedAt);
}
