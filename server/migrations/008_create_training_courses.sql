BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(160) NOT NULL,
  title_en VARCHAR(220) NOT NULL,
  title_am VARCHAR(220) NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_am TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT training_courses_status_check
    CHECK (status IN ('draft', 'published')),
  CONSTRAINT training_courses_sort_order_check
    CHECK (sort_order >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS training_courses_slug_unique_lower
  ON training_courses (LOWER(slug));

CREATE INDEX IF NOT EXISTS training_courses_status_sort_idx
  ON training_courses (status, sort_order, created_at);

CREATE TABLE IF NOT EXISTS training_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL
    REFERENCES training_courses(id)
    ON DELETE CASCADE,
  title_en VARCHAR(220) NOT NULL,
  title_am VARCHAR(220) NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_am TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT training_sections_sort_order_check
    CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS training_sections_course_sort_idx
  ON training_sections (course_id, sort_order, created_at);

CREATE TABLE IF NOT EXISTS training_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL
    REFERENCES training_sections(id)
    ON DELETE CASCADE,
  title_en VARCHAR(220) NOT NULL,
  title_am VARCHAR(220) NOT NULL,
  summary_en TEXT NOT NULL DEFAULT '',
  summary_am TEXT NOT NULL DEFAULT '',
  notes_en TEXT NOT NULL DEFAULT '',
  notes_am TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  video_public_id VARCHAR(500),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_preview BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT training_lessons_duration_check
    CHECK (duration_seconds >= 0),
  CONSTRAINT training_lessons_sort_order_check
    CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS training_lessons_section_sort_idx
  ON training_lessons (section_id, sort_order, created_at);

CREATE TABLE IF NOT EXISTS training_lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL
    REFERENCES training_lessons(id)
    ON DELETE CASCADE,
  label_en VARCHAR(220) NOT NULL,
  label_am VARCHAR(220) NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT training_lesson_resources_sort_order_check
    CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS training_lesson_resources_lesson_sort_idx
  ON training_lesson_resources (lesson_id, sort_order, created_at);

COMMIT;