-- 001_leads.sql — table lead générique (cœur produit scout standalone).
-- Pas de colonne métier : les champs spécifiques vivent dans `data jsonb`.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS leads (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'new',
  source          TEXT,
  data            JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Verrou exclusif multi-utilisateur (claimable)
  claimed_by      TEXT,
  claimed_by_name TEXT,
  claimed_at      TIMESTAMPTZ,

  -- Audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by      TEXT
);

CREATE INDEX IF NOT EXISTS leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS leads_source ON leads (source);
CREATE INDEX IF NOT EXISTS leads_claimed_by ON leads (claimed_by);
CREATE INDEX IF NOT EXISTS leads_name_trgm ON leads USING GIN (name gin_trgm_ops);
