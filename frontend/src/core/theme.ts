/**
 * Dynamically load a mission's theme.css.
 * Removes any previously-loaded scout theme link to allow theme swap at runtime.
 */
const THEME_LINK_ID = "scout-mission-theme";

export function loadMissionTheme(href: string | undefined): void {
  if (!href) return;
  const existing = document.getElementById(THEME_LINK_ID);
  if (existing) existing.remove();
  const link = document.createElement("link");
  link.id = THEME_LINK_ID;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Set the [data-theme="<id>"] attribute on the root element so the mission's
 * theme.css (which scopes via `[data-theme="<id>"] { ... }`) cascades.
 * Switching missions = re-call this with a different id.
 */
export function applyThemeAttribute(themeId: string): void {
  document.documentElement.setAttribute("data-theme", themeId);
}

export function applyBranding(opts: { name?: string; faviconUrl?: string }): void {
  if (opts.name) document.title = opts.name;
  if (opts.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = opts.faviconUrl;
  }
}
