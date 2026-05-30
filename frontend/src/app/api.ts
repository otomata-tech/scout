/**
 * Lead API client for the standalone scout app.
 * Wraps scout's generic fetch helper with typed /api/leads routes.
 */
import { createApiClient, getAccessToken } from "@/index";

export interface Lead {
  id: number;
  name: string;
  status: string;
  source: string | null;
  data: Record<string, unknown>;
  claimedBy: string | null;
  claimedByName: string | null;
  claimedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface LeadLog {
  id: number;
  kind: string;
  content: string;
  metadata: Record<string, unknown> | null;
  createdBy: string | null;
  createdAt: string;
}

const client = createApiClient(getAccessToken);
const BASE = "/api/leads";

export const leadsApi = {
  list: (params: { status?: string; q?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== "") as [string, string][],
    ).toString();
    return client.call<{ leads: Lead[] }>(`${BASE}${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => client.call<Lead>(`${BASE}/${id}`),
  create: (body: { name: string; status?: string; source?: string | null; data?: Record<string, unknown> }) =>
    client.call<Lead>(BASE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  update: (id: number, patch: Partial<Pick<Lead, "name" | "status" | "source" | "data">>) =>
    client.call<Lead>(`${BASE}/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) }),
  remove: (id: number) => client.call<{ deleted: boolean }>(`${BASE}/${id}`, { method: "DELETE" }),
  claim: (id: number) => client.call<{ ok: boolean; lead: Lead | null }>(`${BASE}/${id}/claim`, { method: "POST" }),
  release: (id: number) => client.call<{ ok: boolean; lead: Lead | null }>(`${BASE}/${id}/release`, { method: "POST" }),
  logs: (id: number) => client.call<{ logs: LeadLog[] }>(`${BASE}/${id}/logs`),
};

export const LEAD_STATUSES = ["new", "qualified", "contacted", "won", "lost"] as const;
