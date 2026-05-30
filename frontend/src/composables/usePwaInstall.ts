import { computed, ref } from "vue";

// The `beforeinstallprompt` event isn't in the DOM lib typings yet.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Module-level state so the captured prompt survives component remounts and the
// window listeners are registered exactly once for the whole app.
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const installed = ref(false);
let initialized = false;

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    // iOS Safari exposes this non-standard flag in installed mode.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIPhone = /iphone|ipod|ipad/i.test(ua);
  // iPadOS 13+ masquerades as macOS Safari — disambiguate via touch support.
  const isIPadOS = /Macintosh/.test(ua) && "ontouchend" in document;
  return isIPhone || isIPadOS;
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt.value = e as BeforeInstallPromptEvent;
  });
  window.addEventListener("appinstalled", () => {
    installed.value = true;
    deferredPrompt.value = null;
  });
}

export function usePwaInstall() {
  init();

  const standalone = detectStandalone();
  const ios = detectIos();
  const canPrompt = computed(() => deferredPrompt.value !== null);
  // What to surface in the UI: the native prompt button, or iOS share-sheet
  // instructions (Safari has no beforeinstallprompt). Nothing once installed.
  const canInstall = computed(
    () => !installed.value && !standalone && (canPrompt.value || ios),
  );

  async function promptInstall(): Promise<boolean> {
    const evt = deferredPrompt.value;
    if (!evt) return false;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    deferredPrompt.value = null;
    if (outcome === "accepted") installed.value = true;
    return outcome === "accepted";
  }

  return {
    canInstall,
    canPrompt,
    installed,
    isIos: ios,
    isStandalone: standalone,
    promptInstall,
  };
}
