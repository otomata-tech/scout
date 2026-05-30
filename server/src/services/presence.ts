/**
 * Live presence — who currently has an entity "open" (générique).
 *
 * Mécanisme pur : store in-memory (process Node unique, pas de Redis), clé
 * entité → viewers. Éphémère (reset au redéploiement, acceptable pour un
 * indicateur de présence). Expiration lazy à la lecture (pas de timer). Le
 * client bat le cœur via un heartbeat applicatif.
 *
 * Aucune connaissance du domaine : la clé d'entité est une string arbitraire
 * (siren, id, slug…). Chaque appel à {@link makePresence} crée un store isolé.
 */
export interface Viewer {
  sub: string;
  name: string | null;
  lastSeen: number;
}

export interface PresenceConfig {
  /** Fenêtre de validité d'un heartbeat, en ms (défaut 25 000). */
  ttlMs?: number;
}

export function makePresence(cfg: PresenceConfig = {}) {
  const ttlMs = cfg.ttlMs ?? 25_000;
  const byEntity = new Map<string, Map<string, Viewer>>();

  function ping(entityId: string, sub: string, name: string | null): void {
    let viewers = byEntity.get(entityId);
    if (!viewers) {
      viewers = new Map();
      byEntity.set(entityId, viewers);
    }
    viewers.set(sub, { sub, name, lastSeen: Date.now() });
  }

  function leave(entityId: string, sub: string): void {
    byEntity.get(entityId)?.delete(sub);
  }

  /** Viewers actifs (lastSeen dans la fenêtre TTL). Purge lazy au passage. */
  function viewers(entityId: string): Viewer[] {
    const vs = byEntity.get(entityId);
    if (!vs) return [];
    const cutoff = Date.now() - ttlMs;
    for (const [sub, v] of vs) {
      if (v.lastSeen < cutoff) vs.delete(sub);
    }
    if (vs.size === 0) byEntity.delete(entityId);
    return [...(byEntity.get(entityId)?.values() ?? [])];
  }

  return { ping, leave, viewers, ttlMs };
}
