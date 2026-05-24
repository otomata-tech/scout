# MCP Doctrine — conventions agent scout

Principes de design MCP pour les projets scout (lead enrichment platforms). Issu de l'expérience GR (generations-renouvelables) et appliqué à Blitz (movinmotion).

## Architecture 3 couches

```
SERVER_INSTRUCTIONS  →  get_claude_md()  →  get_skill_<name>(params?)
     (eager)               (lazy)                (lazy)
   ~500 chars            doctrine core        grille spécifique
```

- **SERVER_INSTRUCTIONS** : envoyé à chaque client MCP à la connexion (`initialize`). Doit rester minimal (~500 chars) : vocabulaire métier + pointeurs vers les tools de doctrine. Ne PAS y mettre la doctrine complète — ça pollue toutes les conversations connectées au MCP.
- **`get_claude_md()`** : tool MCP lecture pure. Retourne la doctrine core en markdown (workflow, verdicts, règles, action loop). Appelé au début d'une session d'exploration.
- **`get_skill_<name>(params?)`** : tool MCP lecture pure. Retourne la grille d'exploration spécifique (par source, par cible, par workflow). Paramétrable pour ne charger que la section pertinente.

## Pourquoi lazy-load

Le contexte d'un agent Claude est limité. Chaque token compte. Mesures sur GR avant/après :

| Bloc | Eager (avant) | Lazy (après) |
|------|-----:|------:|
| CLAUDE.md agent | 6 630 tokens | 200 tokens |
| SKILL.md | 5 320 tokens | 120 tokens |
| SERVER_INSTRUCTIONS | 540 tokens | 110 tokens |
| Doctrine via tool call | — | ~4 500 tokens (à la demande) |
| **Total** | **~57 500** | **~5 000** |

Le gain vient aussi de l'isolation de l'agent hors du git repo du code (pas d'héritage de CLAUDE.md parent ni de memories dev).

## Source de vérité unique

La doctrine vit dans **un seul fichier TS** côté serveur (ex `graph-doctrine.ts`). Pas de copies dans des .md filesystem.

Le CLAUDE.md de l'agent sandbox dit juste : "appelle `get_claude_md()` pour charger la doctrine". Le SKILL.md du skill dit : "appelle `get_skill_explore(source)` pour la grille". Ce sont des pointeurs, pas des copies.

Avantage : quand la doctrine évolue, un seul endroit à modifier. Tous les clients (Claude Code, Claude.ai, SDK custom) voient la même version.

## Taxonomie des tools

Chaque tool MCP relève d'**une seule** de ces 3 catégories :

### 1. Data platform — CRUD sur la DB projet

Le coeur. Lecture et écriture sur les entités propres au projet (facts, leads, contacts…).

```
Lecture    : get_<entity>(id)           → 1 item + contexte
             list_<entities>(filters)   → liste paginée
             find_<entities>(q, ...)    → recherche libre
             search_<entity>_by_<dim>   → recherche par dimension
Écriture   : add_<entity>(payload)      → création idempotente
             update_<entity>(id, patch) → mise à jour partielle
Linking    : propose_<link>(ids, reason)→ lien entre entités
Journaling : log_<event>(verdict, ...)  → trace d'action agent
Doctrine   : get_claude_md()            → doctrine core
             get_skill_<name>(params?)  → grille spécifique
```

### 2. Source connectors — appels API externes

Interrogent une API tierce et retournent des données. Deux sous-patterns :

- **Read-only** (`list_*`, `search_*`) : retournent des métadonnées sans écrire. Ex: `list_inpi_exercises(siren)` → exercices dispos, pas encore en DB.
- **Fetch + persist** (`add_*`) : appellent l'API ET écrivent en DB en un seul appel. Acceptable quand l'API est fiable et rapide, et que l'agent sait qu'il veut le résultat. Ex: `add_re(siren)` → fetch Recherche Entreprises + INSERT.

### 3. Outils tiers déjà dans Oto — NE PAS dupliquer

Si un outil existe déjà dans un MCP transverse (Oto, Kaspr, LinkedIn…), ne pas le recréer dans le MCP projet. Exposer uniquement un **tool persist-only** qui prend un payload pré-fetché.

```
❌  fetch_kaspr_contact(slug)       → appelle Kaspr API (doublon Oto)
✅  add_contact(payload)            → persiste un contact déjà enrichi via Oto
```

L'agent orchestre : Oto pour fetch, MCP projet pour persist. Avantages :
- Pas de clé API à configurer côté MCP projet
- Fonctionne sur claude.ai (qui a Oto mais pas les secrets projet)
- Pas de maintenance de wrapper dupliqué

## Design des tools — règles

### Principes

1. **1 tool = 1 opération atomique.** L'agent compose, le serveur ne décide rien.
2. **Service pattern** : tool → service → DB. Jamais de SQL dans un tool.
3. **Idempotent par clé naturelle.** Dedup avant INSERT, retourne `created: boolean`.
4. **Append-only** : les enrichissements ajoutent des faits, ne modifient pas l'existant.
5. **L'agent décide les liens** : un tool persiste une donnée brute, l'agent décide comment la rattacher.
6. **Toujours persister.** Pas de flag `persist: boolean`. Si l'agent appelle, il veut le résultat en DB. Un flag dual crée 2 tools en 1, avec 2 types de retour et des fuites de coût (appels non-persistés = invisibles aux futurs agents → re-fetch payant).

### Réponses légères

Le contexte agent est précieux. Chaque tool doit minimiser sa réponse :

- **Defaults de pagination bas** : 15 résultats par défaut (pas 50). L'agent peut demander plus via `limit`/`per_page`.
- **Trim les payloads lourds** : dans les réponses qui incluent des entités complètes (chaînes de facts, clusters), supprimer les champs volumineux (`_geo`, `matching_etablissements`, arrays de bâtiments, etc.) via une fonction `trimForMcp()` côté tool.
- **Ne pas retourner 2 fois la même donnée.** Ex: `probe_foncier_address` retournait le payload complet ET un résumé agent → retourner seulement le résumé.
- **Arrays tronqués** : >5 items → slice + `_<field>_truncated: N` pour signaler qu'il y en a plus.
- **Strings tronquées** : >300 chars → slice + `…`.

### Anti-patterns

| Anti-pattern | Pourquoi c'est un problème | Fix |
|---|---|---|
| Flag `persist: boolean` | 2 tools en 1, fuites de coût | Toujours persister |
| `default(50)` sur pagination | Pollue le contexte agent | `default(15)`, max 50 |
| Retourner `payload` complet | Facts lourds (5-15 KB) dans les chaînes | `trimForMcp()` |
| Dupliquer un outil Oto | Clé API manquante sur claude.ai, maintenance double | `add_*` persist-only |
| Append-only sans dedup | Double appel = 2 facts identiques | Check clé naturelle avant INSERT |

### Transport

Même registry de tools, deux transports :
- **stdio** : dev local (`npm run mcp:dev`), pas d'auth
- **HTTP Streamable** : prod (`/mcp`), OAuth Logto (resource indicator = URL du MCP)

## Agent sandbox

L'agent d'exploration vit dans un dossier séparé du code source :
- Pas dans le git repo du code (sinon il hérite du CLAUDE.md technique + des memories dev)
- Emplacement type : `/data/agents/<projet>/`
- Contenu minimal : `CLAUDE.md` (pointeur), `.mcp.json` (connexion MCP), `.claude/skills/` (skills pointeurs)

### Deux environnements : local et prod

Le sandbox se décline en deux sous-dossiers pour cibler des DB différentes :

```
/data/agents/<projet>/
├── CLAUDE.md              # partagé (les sous-dossiers symlinkent)
├── .claude/               # skills + settings partagés
├── local/
│   ├── CLAUDE.md → ../CLAUDE.md
│   ├── .claude/  → ../.claude/
│   └── .mcp.json          # MCP stdio → DB locale (ex localhost:5432)
└── prod/
    ├── CLAUDE.md → ../CLAUDE.md
    ├── .claude/  → ../.claude/
    ├── .mcp.json          # MCP stdio → DB prod via tunnel SSH
    └── start-tunnel.sh    # ouvre le tunnel avant usage
```

Le MCP tourne en **stdio local** dans les deux cas (même code serveur, même registry de tools). Seul `DATABASE_URL` change, injecté via le champ `env` du `.mcp.json` :

```json
{
  "mcpServers": {
    "gr-prod": {
      "command": "node",
      "args": ["--env-file=.env", "--import", "tsx", "src/mcp/server-stdio.ts"],
      "cwd": "/data/missions/<projet>/server",
      "env": {
        "DATABASE_URL": "postgres://user:pass@localhost:<tunnel_port>/db?sslmode=require"
      }
    }
  }
}
```

Le `env` du `.mcp.json` override le `DATABASE_URL` du `.env` fichier. Le serveur stdio se connecte à la DB tunnelée comme s'il était local.

**Tunnel SSH** (`start-tunnel.sh`) : forward du port de la DB managed vers localhost. À lancer avant `claude`. Le script vérifie si le port est déjà ouvert (idempotent).

**Usage** :
```bash
cd /data/agents/<projet>/local && claude    # DB locale
cd /data/agents/<projet>/prod && ./start-tunnel.sh && claude  # DB prod
```

**Sync local → prod** : script dédié (`sync_db_to_prod.ts`) qui pipe COPY delta via SSH bastion. Mode `delta-by-id` (MAX(id) prod, exporte seulement les rows plus récentes). Pas de dump/restore, pas de fichier intermédiaire.

## Implémentation de référence

- **GR** : `code/server/src/services/graph-doctrine.ts` — `getClaudeMd()` + `getSkillExplore(source?)`
- **GR** : `code/server/src/mcp/tools-read-chain.ts` — enregistrement des tools doctrine
- **GR** : `code/server/src/mcp/tools-helpers.ts` — `trimChainForMcp()` (trim payloads lourds)
- **GR** : `code/server/src/mcp/server.ts` — SERVER_INSTRUCTIONS minimal (~110 tokens)
- **GR** : `/data/agents/generations-renouvelables/` — sandbox agent isolé

## Changelog

- **2026-05-24** : ajout taxonomie 3 types de tools, règle "toujours persister" (pas de flag persist), réponses légères (defaults 15, trim payloads), anti-patterns. Issu du refactor GR : retrait Kaspr/LinkedIn (→ Oto + add_contact persist-only), dedup INPI/BEGES, suppression flags persist sur probe_foncier et search_company_news, trimChainForMcp.
- **2026-05-23** : version initiale — lazy-load doctrine, source de vérité unique, agent sandbox, nommage tools.
