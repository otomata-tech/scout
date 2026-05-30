-- 005_provider_calls.sql — log des appels providers d'enrichissement (makeProviderCalls).

CREATE TABLE IF NOT EXISTS provider_calls (
  id            SERIAL PRIMARY KEY,
  provider      TEXT NOT NULL,
  siren         TEXT,
  contact_id    INTEGER,
  linkedin_slug TEXT,
  success       BOOLEAN NOT NULL,
  phones_found  INTEGER NOT NULL DEFAULT 0,
  emails_found  INTEGER NOT NULL DEFAULT 0,
  credits_used  INTEGER,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_calls_provider ON provider_calls (provider);
CREATE INDEX IF NOT EXISTS provider_calls_created ON provider_calls (created_at);
