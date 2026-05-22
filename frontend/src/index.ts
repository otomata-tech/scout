// Core
export type { MissionConfig, BrandingConfig, NavItem, ThemeTokens, IconComponent } from "./core/types";
export { loadMissionTheme, applyBranding } from "./core/theme";
export { mountShell, type MountOptions } from "./core/mount";
export {
  createApiClient,
  missionApiBase,
  invalidateCache,
  type ScoutApiClient,
  type CacheInfo,
  type GetAuthToken,
} from "./core/api";

// Shell components (re-exported for direct import inside missions)
export { default as DashboardLayout } from "./shell/DashboardLayout.vue";
export { default as ShellApp } from "./shell/ShellApp.vue";
export { default as SidebarNav } from "./shell/SidebarNav.vue";
export { default as Header } from "./shell/Header.vue";
export { default as StatCard } from "./shell/StatCard.vue";
export { default as BarRow } from "./shell/BarRow.vue";
export { default as DataTable, type ColumnDef } from "./shell/DataTable.vue";
export { default as CacheBadge } from "./shell/CacheBadge.vue";

// Utils
export { cn, formatNumber, formatPct, formatDate, ageLabel } from "./lib/utils";
