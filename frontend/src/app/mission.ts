/**
 * Built-in "scout" mission — the standalone SaaS shell (generic lead product).
 * A real tenant would ship its own MissionConfig; this drives scout out of the box.
 */
import type { MissionConfig } from "@/core/types";

export const scoutMission: MissionConfig = {
  id: "scout",
  name: "scout",
  branding: { logoText: "scout", subtitle: "Lead workspace" },
  navSections: [
    {
      label: "Workspace",
      items: [{ label: "Leads", path: "/leads", icon: "user-add" }],
    },
    {
      label: "Admin",
      items: [
        { label: "Doctrine", path: "/admin/doctrine", icon: "doc" },
        { label: "Coûts providers", path: "/admin/costs", icon: "bolt" },
        { label: "API tokens", path: "/admin/api-tokens", icon: "copy" },
      ],
    },
  ],
  routes: [
    { path: "/", redirect: "/leads" },
    { path: "/leads", name: "leads", component: () => import("./views/Leads.vue") },
    { path: "/leads/:id", name: "lead-detail", component: () => import("./views/LeadDetail.vue") },
    { path: "/admin/doctrine", name: "doctrine", component: () => import("./views/Doctrine.vue") },
    { path: "/admin/costs", name: "provider-costs", component: () => import("./views/ProviderCosts.vue") },
    { path: "/admin/api-tokens", name: "api-tokens", component: () => import("./views/ApiTokens.vue") },
  ],
};
