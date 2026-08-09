BEGIN;

CREATE TABLE IF NOT EXISTS site_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  run_id UUID NOT NULL,

  site_id UUID NOT NULL
    REFERENCES monitored_sites(id)
    ON DELETE CASCADE,

  target VARCHAR(16) NOT NULL
    CHECK (
      target IN (
        'frontend',
        'backend'
      )
    ),

  checked_url TEXT NOT NULL,

  online BOOLEAN NOT NULL,

  status_code INTEGER
    CHECK (
      status_code IS NULL
      OR (
        status_code >= 100
        AND status_code <= 599
      )
    ),

  response_ms INTEGER
    CHECK (
      response_ms IS NULL
      OR response_ms >= 0
    ),

  error_message TEXT,

  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS
  site_health_checks_run_target_unique
ON site_health_checks (
  site_id,
  run_id,
  target
);

CREATE INDEX IF NOT EXISTS
  site_health_checks_site_date_index
ON site_health_checks (
  site_id,
  checked_at DESC
);

CREATE INDEX IF NOT EXISTS
  site_health_checks_site_target_date_index
ON site_health_checks (
  site_id,
  target,
  checked_at DESC
);

CREATE INDEX IF NOT EXISTS
  site_health_checks_online_date_index
ON site_health_checks (
  site_id,
  online,
  checked_at DESC
);

COMMIT;