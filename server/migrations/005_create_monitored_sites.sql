BEGIN;

CREATE TABLE IF NOT EXISTS monitored_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL,

  frontend_url TEXT NOT NULL,
  backend_url TEXT,
  health_url TEXT,

  vercel_project_id VARCHAR(255),
  vercel_team_id VARCHAR(255),

  analytics_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  monitoring_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  created_by UUID REFERENCES admins(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS
  monitored_sites_slug_unique_lower
ON monitored_sites (
  LOWER(slug)
);

CREATE INDEX IF NOT EXISTS
  monitored_sites_created_at_index
ON monitored_sites (
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  monitored_sites_monitoring_index
ON monitored_sites (
  monitoring_enabled,
  analytics_enabled
);

COMMIT;