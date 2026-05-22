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
  /** Sidebar navigation items */
  navItems: NavItem[];
  /** Vue Router routes for this mission */
  routes: RouteRecordRaw[];
}

export interface BrandingConfig {
  logoUrl?: string;
  logoText?: string;
  subtitle?: string;
  faviconUrl?: string;
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
