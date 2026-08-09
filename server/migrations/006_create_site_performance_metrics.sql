BEGIN;

CREATE TABLE IF NOT EXISTS site_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  site_id UUID NOT NULL
    REFERENCES monitored_sites(id)
    ON DELETE CASCADE,

  metric_name VARCHAR(8) NOT NULL
    CHECK (
      metric_name IN (
        'LCP',
        'INP',
        'CLS'
      )
    ),

  metric_value DOUBLE PRECISION NOT NULL
    CHECK (
      metric_value >= 0
    ),

  metric_id VARCHAR(200) NOT NULL,

  rating VARCHAR(24) NOT NULL
    CHECK (
      rating IN (
        'good',
        'needs-improvement',
        'poor'
      )
    ),

  pathname TEXT NOT NULL DEFAULT '/',

  device_type VARCHAR(20) NOT NULL DEFAULT 'unknown'
    CHECK (
      device_type IN (
        'desktop',
        'mobile',
        'tablet',
        'unknown'
      )
    ),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS
  site_performance_metrics_unique_metric
ON site_performance_metrics (
  site_id,
  metric_name,
  metric_id
);

CREATE INDEX IF NOT EXISTS
  site_performance_metrics_site_date_index
ON site_performance_metrics (
  site_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  site_performance_metrics_metric_date_index
ON site_performance_metrics (
  site_id,
  metric_name,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  site_performance_metrics_path_date_index
ON site_performance_metrics (
  site_id,
  pathname,
  created_at DESC
);

COMMIT;