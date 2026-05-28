# scout

Shell white-label pour plateformes d'enrichissement de leads. Consommé en dep `file:` (dev) / npm (prod) par des projets mission-spécifiques — 1 instance par client. **scout = le châssis** ; la mission branche ses données, vues, thème, branding.

## Stack
- **`@otomata/scout-frontend`** (`./frontend`) : Vue 3 + Vite + Tailwind v4 + shadcn-vue + radix-vue + lucide. Peer deps : `vue`, `vue-router`.
- **`@otomata/scout-server`** (`./server`) : helpers Fastify (agnostiques). Peer deps : `fastify`, `@fastify/{cors,swagger,swagger-ui}`, `fastify-type-provider-zod`, `jose`, `zod`.
- Deux packages publiés séparément (barrel `src/index.ts` = `main`+`types`, pas de build : TS/Vue consommés en source).

## Architecture
```
frontend/src/
├── index.ts        # barrel : tout ce que les missions importent
├── core/           # contrats & bootstrap (PAS d'UI)
│   ├── types.ts    #   MissionConfig, NavSection, SearchProvider… ← le contrat mission
│   ├── mount.ts    #   mountShell() : router + thème + branding + mount
│   ├── theme.ts    #   loadMissionTheme / applyBranding / applyThemeAttribute
│   └── api.ts      #   createApiClient (fetch + auth header + capture x-cache)
├── shell/          # composants : ShellApp, DashboardLayout, SidebarNav, Header,
│                   #   CommandPalette + primitives (DataTable, StatCard, FilterBar,
│                   #   CallPanel, Heatmap, Timeline, Chip, Tier…) + Icons.ts
├── assets/theme.css# tokens --scout-* (palette, radius, fonts, transitions)
└── lib/utils.ts    # cn + formatters (formatNumber/Pct/Date, ageLabel)

server/src/
├── index.ts        # barrel
├── build-app.ts    # buildScoutApp() : cors + swagger + auth preHandler scopé /api/missions/<id>/*
├── auth.ts         # makeAuthPreHandler (Logto JWT via jose/JWKS) + TokenVerifier hook
├── cache.ts        # memoCached (TTL in-memory) + applyCacheHeaders (x-cache/-age/-at)
├── oauth.ts        # OAuthClient générique (refresh token : Zoho, HubSpot, Salesforce…)
└── connectors/zoho.ts # ZohoCrmClient (COQL, renvoie camelCase) + esc()
```

## Commands
- `cd frontend && npm run typecheck` (`vue-tsc --noEmit`) · `cd server && npm run typecheck` (`tsc --noEmit`).
- Pas de build/test/dev propres : scout est une lib, on la teste **via un consumer** (`cd <consumer>/frontend && vue-tsc -b` + `vite build`).
- Editer scout puis valider chez le consumer (symlink `file:`). En prod le deploy du consumer clone scout en sibling et réécrit les paths `file:`.

## Conventions
- **Zéro fuite client** : aucun nom/logo/donnée de mission dans scout. Si un identifiant client apparaît dans `shell/` ou `core/`, c'est un bug de contrat.
- **Ajouter une capacité = un contrat dans `core/types.ts`**, pas du code mission. Pattern : champ optionnel sur `MissionConfig` (provider/slot/component) que la mission fournit ; le shell ne rend la feature que si le champ est présent (rétrocompatible). Ex : `search?: SearchProvider`, `sidebarFooter?: Component`.
- **Tout nouvel export passe par le barrel** `src/index.ts` (frontend) / `server/src/index.ts`.
- **Styles** : utiliser les tokens `--scout-*` (jamais de couleur en dur). Composants en `<style scoped>` ou classes `.scout-*` dans `theme.css`.
- Pre-1.0 : minor sur ajout additif, major sur rupture de contrat. Tags `v0.x.0`.
- Cf. global `~/.claude/CLAUDE.md` (pas de fichier > 500 lignes, pas de fallback legacy → throw).

## Key concepts
- **MissionConfig** (`core/types.ts`) = le contrat unique côté frontend : `id`, `branding`, `navSections`/`navItems`, `routes`, + slots/providers optionnels (`sidebarFooter`, `search`). `mountShell({ mission })` fait le reste. Exemples complets dans `README.md`.
- **MissionPlugin** (server) = un plugin Fastify monté sous `/api/missions/<id>/*` par `buildScoutApp`. Le shell gère cors/swagger/auth ; la mission gère ses routes.
- **SearchProvider** : la palette `⌘K` (`CommandPalette.vue`) est générique ; la mission injecte `search(q) → SearchResult[]`. La barre header ne s'affiche que si un provider existe.
- **Auth** : Logto OIDC, JWT vérifié par `makeAuthPreHandler` (JWKS via `jose`). Hook `TokenVerifier` optionnel pour des schémas custom (ex : API tokens d'un consumer).
- **Cache** : `memoCached` (TTL in-process) ; `applyCacheHeaders` pose `x-cache`/`-age`/`-at`, lus côté front par `createApiClient` (badge `CacheBadge`).
- **Nuance Zoho** : malgré le README (« scout knows nothing about Zoho »), un `ZohoCrmClient` ship dans scout-server (connecteur CRM réutilisable, renvoie **camelCase**). `OAuthClient` reste lui générique multi-provider.

## Docs
- `README.md` — contrat mission (frontend+server) avec exemples de code, versioning, table des consumers.
- `docs/mcp-doctrine.md` — doctrine agent / MCP côté prod (claude.ai + MCP HTTP).
