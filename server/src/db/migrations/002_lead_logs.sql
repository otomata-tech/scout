-- 002_lead_logs.sql — journal append-only par lead (entity-log, clé = lead_id).

CREATE TABLE IF NOT EXISTS lead_logs (
  id         SERIAL PRIMARY KEY,
  lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  content    TEXT NOT NULL,
  metadata   JSONB,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_logs_lead_id ON lead_logs (lead_id);
