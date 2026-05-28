import type { Component } from "vue";
import type { RouteRecordRaw } from "vue-router";

/**
 * One mission = one client / tenant instance of scout.
 * The shell consumes a MissionConfig and is fully driven by it.
 */
export interface MissionConfig {
  /** Stable identifier — used for /api/missions/<id> URL scope */
  id: string;
  /** Display name (header, document title) */
  name: string;
  /** Path to a CSS file overriding the theme tokens (loaded at bootstrap) */
  themeUrl?: string;
  /** Brand assets */
  branding: BrandingConfig;
  /** Sidebar navigation items (flat — rendered as a single "Pipeline" section) */
  navItems?: NavItem[];
  /** Sidebar navigation sections (takes precedence over navItems) */
  navSections?: NavSection[];
  /** Vue Router routes for this mission */
  routes: RouteRecordRaw[];
  /** Component rendered at the bottom of the sidebar (e.g. user menu / logout) */
  sidebarFooter?: Component;
  /**
   * Search provider backing the header command palette (⌘K).
   * The mission queries its own data sources and returns navigable results.
   * When omitted, the command bar is not rendered.
   */
  search?: SearchProvider;
}

/** A single hit returned by a mission's {@link SearchProvider}. */
export interface SearchResult {
  /** Stable unique key (used for :key and de-duplication) */
  id: string;
  /** Primary label */
  title: string;
  /** Optional secondary line (siren, account, status…) */
  subtitle?: string;
  /** Group header the result is filed under (e.g. "Leads", "Deals") */
  group: string;
  /** Router path to navigate to on select */
  to: string;
  /** Optional scout icon name (see Icons.ts) */
  icon?: string;
}

/**
 * Resolves a free-text query to a flat list of results.
 * Called debounced by the command palette; should be cancellation-tolerant
 * (the palette ignores results from stale queries).
 */
export type SearchProvider = (query: string) => Promise<SearchResult[]>;

export interface BrandingConfig {
  logoUrl?: string;
  logoText?: string;
  subtitle?: string;
  faviconUrl?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface NavItem {
  label: string;
  path: string;
  /** Lucide icon name (e.g. "home", "table-2") */
  icon?: string;
  /** Badge text or number shown next to the label */
  badge?: string | number;
}

/**
 * Theme tokens that scout's shell uses.
 * The mission's theme.css overrides these CSS variables on :root.
 */
export interface ThemeTokens {
  "--color-background"?: string;
  "--color-foreground"?: string;
  "--color-card"?: string;
  "--color-muted"?: string;
  "--color-muted-foreground"?: string;
  "--color-border"?: string;
  "--color-primary"?: string;
  "--color-primary-foreground"?: string;
  "--color-accent"?: string;
  "--color-accent-foreground"?: string;
  "--font-sans"?: string;
  "--font-mono"?: string;
}

export type IconComponent = Component;
