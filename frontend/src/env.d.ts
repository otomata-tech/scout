// Minimal Vite env typing for scout (the package isn't built with vite directly,
// but composables read `import.meta.env`). Consumers' own vite/client types
// augment this further. Only the keys scout itself reads are declared here.
interface ImportMetaEnv {
  readonly VITE_LOGTO_ENDPOINT?: string;
  readonly VITE_LOGTO_APP_ID?: string;
  readonly VITE_LOGTO_AUDIENCE?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
