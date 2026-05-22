import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
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
}

/**
 * Bootstrap a scout-shell app for the given mission.
 * - Loads mission theme.css (which should target [data-theme="<mission.id>"]) and
 *   applies the data-theme attribute on the root element so the cascade kicks in.
 * - Sets document title + favicon.
 * - Builds a vue-router from the mission's routes.
 * - Mounts the shell, passing the mission config.
 */
export function mountShell(opts: MountOptions) {
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
  app.mount(opts.el ?? "#app");
  return app;
}
