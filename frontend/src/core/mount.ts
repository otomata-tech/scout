import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import type { MissionConfig } from "./types";
import { applyBranding, loadMissionTheme } from "./theme";
import ShellApp from "../shell/ShellApp.vue";

export interface MountOptions {
  mission: MissionConfig;
  el?: string | Element;
  /** Default theme to import (CSS path) — usually the consumer's own index.css that imports scout's theme.css */
  defaultThemeImported?: boolean;
}

/**
 * Bootstrap a scout-shell app with the given mission.
 * - Loads mission theme.css (overrides scout default tokens)
 * - Sets document title + favicon
 * - Builds a vue-router from the mission's routes
 * - Mounts the shell, passing the mission config
 */
export function mountShell(opts: MountOptions) {
  loadMissionTheme(opts.mission.themeUrl);
  applyBranding({ name: opts.mission.name, faviconUrl: opts.mission.branding.faviconUrl });

  const router = createRouter({
    history: createWebHistory(),
    routes: opts.mission.routes,
  });

  const app = createApp(ShellApp, { mission: opts.mission });
  app.use(router);
  app.mount(opts.el ?? "#app");
  return app;
}
