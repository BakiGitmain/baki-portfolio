BEGIN;

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  slug VARCHAR(160) NOT NULL,

  title_en VARCHAR(180) NOT NULL,
  title_am VARCHAR(180) NOT NULL,

  category_en VARCHAR(120) NOT NULL,
  category_am VARCHAR(120) NOT NULL,

  short_description_en TEXT NOT NULL,
  short_description_am TEXT NOT NULL,

  description_en TEXT NOT NULL,
  description_am TEXT NOT NULL,

  technologies TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  cover_image_url TEXT NOT NULL,
  cover_image_public_id TEXT NOT NULL,

  live_url TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'draft',

  featured BOOLEAN NOT NULL DEFAULT FALSE,

  sort_order INTEGER NOT NULL DEFAULT 0,

  created_by UUID REFERENCES admins(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT projects_status_check
    CHECK (
      status IN (
        'draft',
        'published'
      )
    ),

  CONSTRAINT projects_sort_order_check
    CHECK (
      sort_order >= 0
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  projects_slug_unique_lower
ON projects (
  LOWER(slug)
);

CREATE INDEX IF NOT EXISTS
  projects_public_listing_index
ON projects (
  status,
  featured DESC,
  sort_order ASC,
  created_at DESC
);

COMMIT;