/**
 * useTabIndicator — signale l'état d'un élément dans l'onglet navigateur même
 * quand il n'est pas au premier plan : préfixe document.title + pastille favicon.
 *
 * État :
 *   "idle"          → onglet normal (favicon d'origine)
 *   "viewers"       → d'autres personnes ont l'élément ouvert (disque orange + 👀)
 *   "claimed-other" → l'élément est pris par quelqu'un d'autre (disque rouge + 🔒)
 *
 * La favicon active est dessinée **from scratch** sur un <canvas> (un disque de
 * couleur), pas à partir de la favicon existante — évite tout problème de canvas
 * "tainted" cross-origin qui faisait échouer toDataURL() silencieusement.
 */
import { onUnmounted } from "vue";

export type TabState = "idle" | "viewers" | "claimed-other";

const DOT_COLORS: Record<Exclude<TabState, "idle">, string> = {
  viewers: "#f59e0b",       // orange
  "claimed-other": "#dc2626", // rouge
};
const PREFIX: Record<Exclude<TabState, "idle">, string> = {
  viewers: "👀 ",
  "claimed-other": "🔒 ",
};

/** Favicon = disque plein de couleur (lisible à 16px), bordure blanche. */
function discDataUrl(color: string): string {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  return canvas.toDataURL("image/png");
}

function currentIconHref(): string {
  return document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href ?? "/favicon.ico";
}

/** Remplace toutes les balises icon par une seule — plus fiable que muter .href. */
function setFavicon(href: string) {
  document.querySelectorAll('link[rel~="icon"]').forEach((l) => l.remove());
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = href;
  document.head.appendChild(link);
}

export function useTabIndicator() {
  const originalHref = currentIconHref();
  const originalTitle = document.title;
  let baseTitle = originalTitle;

  function setBaseTitle(t: string) {
    baseTitle = t;
  }

  function setState(state: TabState) {
    if (state === "idle") {
      setFavicon(originalHref);
      document.title = baseTitle;
      return;
    }
    document.title = PREFIX[state] + baseTitle;
    const url = discDataUrl(DOT_COLORS[state]);
    if (url) setFavicon(url);
  }

  function reset() {
    setFavicon(originalHref);
    document.title = originalTitle;
  }

  onUnmounted(reset);

  return { setState, setBaseTitle, reset };
}
