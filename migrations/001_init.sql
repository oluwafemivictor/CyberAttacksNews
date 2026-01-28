-- Initial schema for CyberAttacksNews

BEGIN;

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  severity smallint NOT NULL DEFAULT 2,
  status smallint NOT NULL DEFAULT 1,
  discovery_date timestamptz NOT NULL DEFAULT now(),
  last_updated timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS incidents_title_idx ON incidents USING gin (to_tsvector('english', title || ' ' || coalesce(description, '')));

CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  details jsonb
);

CREATE INDEX IF NOT EXISTS timeline_incident_idx ON timeline_events (incident_id);

CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  source_type text,
  added_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sources_incident_idx ON sources (incident_id);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  alert_type text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
