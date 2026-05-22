/**
 * Generic OAuth 2.0 refresh-token client.
 * Works with any provider that follows the standard refresh_token grant
 * (Zoho CRM, HubSpot, Salesforce, Pipedrive, etc.).
 *
 * Caches the access token in memory until 5 min before expiry.
 */

export interface OAuthRefreshConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  tokenUrl: string;          // e.g. https://accounts.zoho.eu/oauth/v2/token
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

export class OAuthClient {
  private cache: TokenCache | null = null;

  constructor(private readonly config: OAuthRefreshConfig) {}

  private async refresh(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
    });

    const res = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      throw new Error(`OAuth refresh failed: ${res.status} ${await res.text()}`);
    }

    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.cache = {
      accessToken: json.access_token,
      // Refresh 5 min before actual expiry
      expiresAt: Date.now() + (json.expires_in - 300) * 1000,
    };
    return json.access_token;
  }

  async getAccessToken(): Promise<string> {
    if (this.cache && this.cache.expiresAt > Date.now()) return this.cache.accessToken;
    return this.refresh();
  }
}
