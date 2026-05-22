import { createApp, type App } from "vue";
import { createRouter, createWebHistory, type Router } from "vue-router";
import type { MissionConfig } from "./types";
import { applyBranding, loadMissionTheme, applyThemeAttribute } from "./theme";
import ShellApp from "../shell/ShellApp.vue";

export interface MountOptions {
  mission: MissionConfig;
  el?: string | Element;
  /** "compact" | "default" | "comfortable" — applied to <html data-density="…">. */
  density?: "compact" | "default" | "comfortable";
  /** "full" | "rail" — applied to <html data-nav="…">. */
  navMode?: "full" | "rail";
  /**
   * Hook called after the router is created but before mount — lets the mission
   * register a `router.beforeEach` auth guard, install plugins, etc.
   */
  beforeMount?: (ctx: { app: App; router: Router }) => void | Promise<void>;
}

export interface MountResult {
  app: App;
  router: Router;
}

/**
 * Bootstrap a scout-shell app for the given mission.
 * - Loads mission theme.css (`[data-theme="<mission.id>"]`) + sets the attribute
 * - Sets document title + favicon
 * - Builds a vue-router from the mission's routes
 * - Calls `beforeMount({ app, router })` so the mission can register guards
 * - Mounts the shell
 */
export async function mountShell(opts: MountOptions): Promise<MountResult> {
  loadMissionTheme(opts.mission.themeUrl);
  applyBranding({ name: opts.mission.name, faviconUrl: opts.mission.branding.faviconUrl });
  applyThemeAttribute(opts.mission.id);

  if (opts.density) document.documentElement.setAttribute("data-density", opts.density);
  if (opts.navMode) document.documentElement.setAttribute("data-nav", opts.navMode);

  const router = createRouter({
    history: createWebHistory(),
    routes: opts.mission.routes,
  });

  const app = createApp(ShellApp, { mission: opts.mission });
  app.use(router);

  if (opts.beforeMount) await opts.beforeMount({ app, router });

  app.mount(opts.el ?? "#app");
  return { app, router };
}
