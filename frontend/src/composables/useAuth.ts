import LogtoClient from "@logto/browser";

/**
 * Logto OIDC auth for scout-based SPAs (générique).
 *
 * Config via env Vite du consommateur :
 *   VITE_LOGTO_ENDPOINT, VITE_LOGTO_APP_ID, VITE_LOGTO_AUDIENCE
 *
 * Si l'une manque → auth désactivée (dev bypass : utilisateur fictif admin).
 */
const endpoint = import.meta.env.VITE_LOGTO_ENDPOINT;
const appId = import.meta.env.VITE_LOGTO_APP_ID;
const audience = import.meta.env.VITE_LOGTO_AUDIENCE;

let client: LogtoClient | null = null;

export function isAuthEnabled(): boolean {
  return Boolean(endpoint && appId && audience);
}

export function getClient(): LogtoClient {
  if (!isAuthEnabled()) throw new Error("Logto not configured");
  if (!client) {
    client = new LogtoClient({
      endpoint: endpoint!,
      appId: appId!,
      resources: [audience!],
    });
  }
  return client;
}

export async function isAuthenticated(): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  return getClient().isAuthenticated();
}

const POST_LOGIN_KEY = "scout:postLoginPath";

export async function login(redirectTo?: string): Promise<void> {
  if (!isAuthEnabled()) return;
  // Stash the post-login destination in sessionStorage. Don't append it as a
  // query param on the callback URL — Logto requires *exact* match on the
  // registered redirect_uri, so any ?next=… would trigger oidc.invalid_redirect_uri.
  if (redirectTo && redirectTo !== "/") sessionStorage.setItem(POST_LOGIN_KEY, redirectTo);
  await getClient().signIn(`${window.location.origin}/callback`);
}

/** Read + clear the post-login destination set by `login()`. */
export function consumePostLoginPath(): string {
  const v = sessionStorage.getItem(POST_LOGIN_KEY);
  if (v) sessionStorage.removeItem(POST_LOGIN_KEY);
  return v ?? "/";
}

export async function logout(): Promise<void> {
  if (!isAuthEnabled()) return;
  await getClient().signOut(window.location.origin);
}

export async function handleCallback(): Promise<void> {
  if (!isAuthEnabled()) return;
  await getClient().handleSignInCallback(window.location.href);
}

export async function getAccessToken(): Promise<string | null> {
  if (!isAuthEnabled()) return null;
  return getClient().getAccessToken(audience);
}

export interface IdTokenClaims {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  [k: string]: unknown;
}

export async function getIdTokenClaims(): Promise<IdTokenClaims | null> {
  if (!isAuthEnabled()) {
    return { sub: "dev-bypass", email: "dev@bypass.local", name: "Dev Bypass" };
  }
  try {
    return (await getClient().getIdTokenClaims()) as IdTokenClaims;
  } catch {
    return null;
  }
}

/**
 * Trigger a sign-in with a Logto one-time token (magic-link).
 * Logto OSS routes this through the standard /sign-in flow with an extra param.
 * If the OTT isn't recognized, falls back to a regular sign-in with email pre-filled.
 */
export async function signInWithToken(token: string, email?: string): Promise<void> {
  if (!isAuthEnabled()) return;
  const url = `${window.location.origin}/callback`;
  await getClient().signIn({
    redirectUri: url,
    extraParams: {
      one_time_token: token,
      ...(email ? { login_hint: email } : {}),
    },
  });
}
