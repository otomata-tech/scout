/**
 * Generic Zoho CRM API client — works with any Zoho CRM org (EU or US DC).
 *
 * Depends on `OAuthClient` from scout for token refresh.
 * Provides `get`, `coql`, `coqlCount`, and `esc` utilities.
 */
import { OAuthClient, type OAuthRefreshConfig } from "../oauth.js";

export interface ZohoCrmConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  apiDomain: string;       // e.g. https://www.zohoapis.eu
  accountsDomain: string;  // e.g. https://accounts.zoho.eu
}

export interface CoqlResponse<T = Record<string, unknown>> {
  data?: T[];
  info?: { count: number; more_records: boolean; next_page_token?: string };
}

export class ZohoCrmClient {
  private oauth: OAuthClient;
  private apiDomain: string;

  constructor(config: ZohoCrmConfig) {
    this.apiDomain = config.apiDomain;
    this.oauth = new OAuthClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken,
      tokenUrl: `${config.accountsDomain}/oauth/v2/token`,
    });
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.oauth.getAccessToken();
    return { Authorization: `Zoho-oauthtoken ${token}` };
  }

  async get<T = unknown>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.apiDomain}${path}`);
    if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const res = await fetch(url, { headers: await this.authHeaders() });
    if (!res.ok) throw new Error(`Zoho GET ${path} failed: ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  }

  async coql<T = Record<string, unknown>>(query: string): Promise<CoqlResponse<T>> {
    const res = await fetch(`${this.apiDomain}/crm/v6/coql`, {
      method: "POST",
      headers: { ...(await this.authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ select_query: query }),
    });
    if (res.status === 204) return { data: [], info: { count: 0, more_records: false } };
    if (!res.ok) throw new Error(`Zoho COQL failed: ${res.status} ${await res.text()}\nQuery: ${query}`);
    return (await res.json()) as CoqlResponse<T>;
  }

  async coqlCount(where: string, module = "Deals"): Promise<number> {
    const r = await this.coql<{ "COUNT(id)": number }>(`SELECT COUNT(id) FROM ${module} WHERE ${where}`);
    return r.data?.[0]?.["COUNT(id)"] ?? 0;
  }
}

/**
 * COQL-safe single-quote escape.
 * Zoho COQL string literals use single quotes; escape inner ' by doubling ('').
 */
export function esc(s: string): string {
  return s.replace(/'/g, "''");
}
