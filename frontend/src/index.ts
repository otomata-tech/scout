// Core
export type { MissionConfig, BrandingConfig, NavItem, NavSection, ThemeTokens, IconComponent } from "./core/types";
export { loadMissionTheme, applyBranding, applyThemeAttribute } from "./core/theme";
export { mountShell, type MountOptions } from "./core/mount";
export {
  createApiClient,
  missionApiBase,
  invalidateCache,
  type ScoutApiClient,
  type CacheInfo,
  type GetAuthToken,
} from "./core/api";

// Shell — layout
export { default as ShellApp } from "./shell/ShellApp.vue";
export { default as DashboardLayout } from "./shell/DashboardLayout.vue";
export { default as SidebarNav } from "./shell/SidebarNav.vue";
export { default as Header } from "./shell/Header.vue";

// Shell — primitives
export { default as StatCard } from "./shell/StatCard.vue";
export { default as BarRow } from "./shell/BarRow.vue";
export { default as BarList } from "./shell/BarList.vue";
export { default as DataTable, type ColumnDef } from "./shell/DataTable.vue";
export { default as MiniTable, type MiniColumnDef } from "./shell/MiniTable.vue";
export { default as Chip } from "./shell/Chip.vue";
export { default as SectionH } from "./shell/SectionH.vue";
export { default as Tier } from "./shell/Tier.vue";
export { default as Heatmap, type HeatBucket } from "./shell/Heatmap.vue";
export { default as Timeline, type TimelineEntry } from "./shell/Timeline.vue";
export { default as CallPanel } from "./shell/CallPanel.vue";
export { default as TodayHero, type TodayCallItem } from "./shell/TodayHero.vue";
export { default as FilterBar } from "./shell/FilterBar.vue";
export { default as FilterGroup } from "./shell/FilterGroup.vue";
export { default as CacheBadge } from "./shell/CacheBadge.vue";

// Icons
export { Icon, iconExists } from "./shell/Icons";

// Utils
export { cn, formatNumber, formatPct, formatDate, ageLabel } from "./lib/utils";
