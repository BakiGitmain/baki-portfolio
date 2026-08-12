BEGIN;

/* =========================================================
   REPRESENTATIVE PROFILE PREFERENCES

   Legal identity fields remain unchanged. display_name is
   the editable portal-facing name, while avatar delivery
   URLs are derived from these Cloudinary identifiers.
   ========================================================= */

ALTER TABLE sales_representatives
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(160),
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(2) NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS avatar_public_id VARCHAR(500),
  ADD COLUMN IF NOT EXISTS avatar_format VARCHAR(20),
  ADD COLUMN IF NOT EXISTS avatar_version BIGINT;

ALTER TABLE sales_representatives
  DROP CONSTRAINT IF EXISTS sales_representatives_preferred_language_check;

ALTER TABLE sales_representatives
  ADD CONSTRAINT sales_representatives_preferred_language_check
  CHECK (preferred_language IN ('en', 'am'));

/* =========================================================
   PARTNER PROGRAMS
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title VARCHAR(220) NOT NULL,
  description TEXT NOT NULL DEFAULT '',

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  assignment_scope VARCHAR(20) NOT NULL DEFAULT 'everyone',

  icon VARCHAR(40),

  created_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_programs_title_check
    CHECK (CHAR_LENGTH(TRIM(title)) BETWEEN 1 AND 220),

  CONSTRAINT partner_programs_date_check
    CHECK (end_date >= start_date),

  CONSTRAINT partner_programs_status_check
    CHECK (
      status IN (
        'draft',
        'scheduled',
        'active',
        'completed',
        'archived'
      )
    ),

  CONSTRAINT partner_programs_assignment_scope_check
    CHECK (assignment_scope IN ('everyone', 'selected'))
);

CREATE INDEX IF NOT EXISTS partner_programs_status_dates_idx
  ON partner_programs (status, start_date, end_date);

CREATE INDEX IF NOT EXISTS partner_programs_updated_idx
  ON partner_programs (updated_at DESC);

CREATE TABLE IF NOT EXISTS partner_program_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  program_id UUID NOT NULL
    REFERENCES partner_programs(id)
    ON DELETE CASCADE,

  target_type VARCHAR(32) NOT NULL,
  target_value INTEGER NOT NULL,

  course_id UUID
    REFERENCES training_courses(id)
    ON DELETE RESTRICT,

  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_program_targets_type_check
    CHECK (
      target_type IN (
        'reports',
        'lessons',
        'course_completion'
      )
    ),

  CONSTRAINT partner_program_targets_value_check
    CHECK (target_value > 0),

  CONSTRAINT partner_program_targets_sort_check
    CHECK (sort_order >= 0),

  CONSTRAINT partner_program_targets_course_shape_check
    CHECK (
      (
        target_type = 'course_completion'
        AND course_id IS NOT NULL
      )
      OR
      (
        target_type <> 'course_completion'
        AND course_id IS NULL
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_program_targets_general_unique
  ON partner_program_targets (program_id, target_type)
  WHERE course_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS partner_program_targets_course_unique
  ON partner_program_targets (program_id, target_type, course_id)
  WHERE course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS partner_program_targets_program_sort_idx
  ON partner_program_targets (program_id, sort_order, created_at);

CREATE TABLE IF NOT EXISTS partner_program_assignments (
  program_id UUID NOT NULL
    REFERENCES partner_programs(id)
    ON DELETE CASCADE,

  representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE CASCADE,

  assigned_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (program_id, representative_id)
);

CREATE INDEX IF NOT EXISTS partner_program_assignments_rep_idx
  ON partner_program_assignments (representative_id, assigned_at DESC);

/* =========================================================
   OPERATIONAL ACTIVITY

   This stores meaningful business events only. Existing
   report/training/application tables remain the source of
   truth for analytics and historical detail.
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  event_type VARCHAR(80) NOT NULL,
  actor_type VARCHAR(24) NOT NULL,

  representative_id UUID
    REFERENCES sales_representatives(id)
    ON DELETE SET NULL,

  admin_user_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  application_id UUID
    REFERENCES sales_representative_applications(id)
    ON DELETE SET NULL,

  report_id UUID
    REFERENCES representative_reports(id)
    ON DELETE SET NULL,

  program_id UUID
    REFERENCES partner_programs(id)
    ON DELETE SET NULL,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_activity_events_type_check
    CHECK (CHAR_LENGTH(TRIM(event_type)) BETWEEN 1 AND 80),

  CONSTRAINT partner_activity_events_actor_check
    CHECK (actor_type IN ('admin', 'representative', 'system'))
);

CREATE INDEX IF NOT EXISTS partner_activity_events_created_idx
  ON partner_activity_events (created_at DESC);

CREATE INDEX IF NOT EXISTS partner_activity_events_rep_created_idx
  ON partner_activity_events (representative_id, created_at DESC)
  WHERE representative_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS partner_activity_events_application_created_idx
  ON partner_activity_events (application_id, created_at DESC)
  WHERE application_id IS NOT NULL;

/* =========================================================
   REPORT EMAIL DELIVERY + ANALYTICS INDEXES
   ========================================================= */

ALTER TABLE representative_reports
  ADD COLUMN IF NOT EXISTS admin_notification_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS representative_reports_created_analytics_idx
  ON representative_reports (created_at DESC, representative_id);

CREATE INDEX IF NOT EXISTS representative_report_replies_created_analytics_idx
  ON representative_report_replies (created_at DESC, report_id);

CREATE INDEX IF NOT EXISTS representative_training_progress_completed_analytics_idx
  ON representative_training_lesson_progress (completed_at DESC, representative_id)
  WHERE completed = TRUE;

COMMIT;
