# scout

White-label shell for lead enrichment platforms. Used as a `file:` or npm dependency by mission-specific projects (1 instance per client).

## Contract

Two packages, both deployable as libraries:

- **`@otomata/scout-frontend`** (`./frontend`) — Vue 3 + Vite + Tailwind v4 + shadcn-vue. Exports : shell layout (sidebar+header+slot), generic UI components, theme loader, types.
- **`@otomata/scout-server`** (`./server`) — Fastify-agnostic helpers. Exports : Logto JWT preHandler factory, in-memory TTL cache, generic OAuth refresh helper (works with Zoho, HubSpot, Salesforce, etc.).

scout knows nothing about Zoho, Movinmotion, or any specific data source. It is the chassis. Missions plug in their own data adapters, views, theme, branding.

## Mission contract (frontend)

A mission module exports :

```ts
import type { MissionConfig } from "@otomata/scout-frontend";

export const movinmotionMission: MissionConfig = {
  id: "movinmotion",
  name: "Movinmotion",
  themeUrl: "/themes/movinmotion.css",  // CSS file with var overrides
  branding: { logoUrl: "/logos/mm.svg", subtitle: "Lead enrichment" },
  navItems: [
    { label: "Dashboard", path: "/", icon: "home" },
    { label: "Deals", path: "/deals", icon: "table" },
  ],
  routes: [
    { path: "/", component: () => import("./views/Dashboard.vue") },
    { path: "/deals", component: () => import("./views/Deals.vue") },
  ],
};
```

The consumer's `main.ts` :

```ts
import { mountShell } from "@otomata/scout-frontend";
import { movinmotionMission } from "./missions/movinmotion";

mountShell({ mission: movinmotionMission, el: "#app" });
```

## Mission contract (server)

A mission plugin is a Fastify plugin :

```ts
import type { FastifyPluginAsync } from "fastify";
import { buildScoutApp } from "@otomata/scout-server";
import { movinmotionPlugin } from "./missions/movinmotion";

const app = await buildScoutApp({
  apiTitle: "blitz",
  missions: [{ id: "movinmotion", plugin: movinmotionPlugin }],
});
await app.listen({ port: 8092 });
```

Each mission plugin is mounted under `/api/missions/<id>/`. The scout shell registers core plugins (cors, swagger, swagger-ui, auth preHandler).

## Versioning

- Pre-1.0 while the contract is fluid (≤ 2 consumer missions).
- Bump minor on additive changes, major on contract breaks.
- Tag releases : `v0.1.0`, `v0.2.0`, etc. Consumer pin via `file:` in dev, npm in prod.

## Why "scout"

Sales prospection metaphor : the lead scout goes ahead and brings back qualified contacts. White-label tool, no Otomata branding leaks through.

## Consumers

| Project | Mission | Repo |
|---|---|---|
| blitz | movinmotion | `/data/ark/movinmotion/code/blitz` |
