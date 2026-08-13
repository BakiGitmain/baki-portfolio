BEGIN;

/* =========================================================
   PROGRAM SOFT DELETION

   Programs own submissions, rewards, assignments and email
   delivery state. A tombstone keeps that history intact while
   every active workflow can exclude the Program consistently.
   ========================================================= */

ALTER TABLE partner_programs
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS partner_programs_active_list_idx
  ON partner_programs (status, start_date DESC, created_at DESC)
  WHERE deleted_at IS NULL;

/* =========================================================
   IMMUTABLE PARTNER CHAT REPORT EVIDENCE

   The source message may be removed by normal Chat retention.
   The evidence snapshot and actor references remain available
   to administrators for moderation review.
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_chat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  message_id UUID
    REFERENCES partner_chat_messages(id)
    ON DELETE SET NULL,

  reporter_representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE RESTRICT,

  reported_sender_type VARCHAR(24) NOT NULL,

  reported_representative_id UUID
    REFERENCES sales_representatives(id)
    ON DELETE SET NULL,

  reported_admin_user_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  reported_name_snapshot VARCHAR(160) NOT NULL,
  reported_reference_snapshot VARCHAR(32),
  message_snapshot TEXT NOT NULL,
  message_sent_at TIMESTAMPTZ NOT NULL,
  reply_context_snapshot TEXT,

  reason VARCHAR(32) NOT NULL,
  note TEXT NOT NULL DEFAULT '',

  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_note TEXT NOT NULL DEFAULT '',
  action_summary TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_chat_reports_sender_type_check
    CHECK (reported_sender_type IN ('representative', 'admin')),

  CONSTRAINT partner_chat_reports_sender_shape_check
    CHECK (
      (
        reported_sender_type = 'representative'
        AND reported_admin_user_id IS NULL
      )
      OR
      (
        reported_sender_type = 'admin'
        AND reported_representative_id IS NULL
      )
    ),

  CONSTRAINT partner_chat_reports_reason_check
    CHECK (
      reason IN (
        'spam',
        'harassment',
        'scam',
        'inappropriate',
        'threats',
        'other'
      )
    ),

  CONSTRAINT partner_chat_reports_status_check
    CHECK (status IN ('pending', 'resolved', 'dismissed')),

  CONSTRAINT partner_chat_reports_message_length_check
    CHECK (CHAR_LENGTH(message_snapshot) BETWEEN 1 AND 4000),

  CONSTRAINT partner_chat_reports_note_length_check
    CHECK (CHAR_LENGTH(note) <= 1000),

  CONSTRAINT partner_chat_reports_reply_length_check
    CHECK (
      reply_context_snapshot IS NULL
      OR CHAR_LENGTH(reply_context_snapshot) <= 1000
    ),

  CONSTRAINT partner_chat_reports_review_shape_check
    CHECK (
      (status = 'pending' AND reviewed_at IS NULL)
      OR
      (status IN ('resolved', 'dismissed') AND reviewed_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_chat_reports_reporter_message_unique
  ON partner_chat_reports (reporter_representative_id, message_id)
  WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS partner_chat_reports_status_created_idx
  ON partner_chat_reports (status, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS partner_chat_reports_reported_rep_idx
  ON partner_chat_reports (reported_representative_id, created_at DESC)
  WHERE reported_representative_id IS NOT NULL;

/* =========================================================
   TEMPORARY AND PERMANENT PARTNER BANS

   Expired rows are history. The active predicate is always
   time-aware, so temporary access restores automatically.
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE RESTRICT,

  banned_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  source_chat_report_id UUID
    REFERENCES partner_chat_reports(id)
    ON DELETE SET NULL,

  reason TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  banned_until TIMESTAMPTZ,
  is_permanent BOOLEAN NOT NULL DEFAULT FALSE,

  ended_at TIMESTAMPTZ,
  ended_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,
  end_reason VARCHAR(24),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_bans_reason_check
    CHECK (CHAR_LENGTH(TRIM(reason)) BETWEEN 1 AND 500),

  CONSTRAINT partner_bans_duration_shape_check
    CHECK (
      (is_permanent = TRUE AND banned_until IS NULL)
      OR
      (
        is_permanent = FALSE
        AND banned_until IS NOT NULL
        AND banned_until > started_at
      )
    ),

  CONSTRAINT partner_bans_end_reason_check
    CHECK (
      end_reason IS NULL
      OR end_reason IN ('unbanned', 'expired')
    ),

  CONSTRAINT partner_bans_end_shape_check
    CHECK (
      (ended_at IS NULL AND end_reason IS NULL)
      OR
      (ended_at IS NOT NULL AND end_reason IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS partner_bans_rep_history_idx
  ON partner_bans (representative_id, started_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS partner_bans_active_lookup_idx
  ON partner_bans (representative_id, banned_until)
  WHERE ended_at IS NULL;

COMMIT;
