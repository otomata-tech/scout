/**
 * Enrichment waterfall strategy (générique).
 *
 * Mécanisme pur : exécute des providers dans l'ordre, en sautant ceux tentés
 * trop récemment (fenêtre `skipWindowDays`), s'arrête dès qu'un provider trouve
 * un téléphone, sinon retient le dernier résultat OK. Aucune connaissance des
 * providers concrets (FullEnrich, Kaspr, …) — chaque provider fournit son
 * `run()` et son `lastAttemptedAt`.
 *
 * Pas de dépendance DB ni réseau : la mission câble les closures qui font le
 * vrai travail (appel provider + stockage contact).
 */

export interface WaterfallProvider<T> {
  /** Nom du provider (pour `used`/`skipped`). */
  name: string;
  /** Dernier essai sur cette cible — sert au skip-if-recent. */
  lastAttemptedAt?: Date | string | null;
  /**
   * Exécute le provider. `phoneFound: true` arrête le waterfall. `result` n'est
   * retenu que si `ok` est vrai.
   */
  run: () => Promise<{ ok: boolean; phoneFound?: boolean; result?: T }>;
}

export interface WaterfallOutcome<T> {
  /** Providers exécutés avec succès (dans l'ordre). */
  used: string[];
  /** Providers sautés (tentés récemment). */
  skipped: string[];
  /** Provider dont le résultat est retenu, ou null. */
  provider: string | null;
  /** Meilleur résultat (premier avec phone, sinon dernier OK), ou null. */
  result: T | null;
}

export function makeWaterfall(opts: { skipWindowDays?: number } = {}) {
  const windowMs = (opts.skipWindowDays ?? 7) * 86_400_000;

  async function run<T>(providers: WaterfallProvider<T>[]): Promise<WaterfallOutcome<T>> {
    const used: string[] = [];
    const skipped: string[] = [];
    const cutoff = Date.now() - windowMs;
    let best: { provider: string; result: T } | null = null;

    for (const p of providers) {
      if (p.lastAttemptedAt && new Date(p.lastAttemptedAt).getTime() > cutoff) {
        skipped.push(p.name);
        continue;
      }
      const r = await p.run();
      if (r.ok && r.result !== undefined) {
        used.push(p.name);
        best = { provider: p.name, result: r.result };
        if (r.phoneFound) break;
      }
    }

    return { used, skipped, provider: best?.provider ?? null, result: best?.result ?? null };
  }

  return { run };
}
