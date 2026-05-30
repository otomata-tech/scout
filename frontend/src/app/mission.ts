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
      items: [{ label: "Leads", path: "/leads", icon: "users" }],
    },
  ],
  routes: [
    { path: "/", redirect: "/leads" },
    { path: "/leads", name: "leads", component: () => import("./views/Leads.vue") },
    { path: "/leads/:id", name: "lead-detail", component: () => import("./views/LeadDetail.vue") },
  ],
};
