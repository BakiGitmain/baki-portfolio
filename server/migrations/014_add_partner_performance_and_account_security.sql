BEGIN;

/* =========================================================
   ADMIN-VERIFIED PARTNER SALES

   Sales are append-only operational records. Reversal keeps
   the original audit trail while removing the sale from all
   active performance calculations.
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_verified_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE CASCADE,

  added_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  source_program_submission_id UUID UNIQUE
    REFERENCES partner_program_submissions(id)
    ON DELETE SET NULL,

  reference VARCHAR(160),
  note TEXT NOT NULL DEFAULT '',

  status VARCHAR(20) NOT NULL DEFAULT 'active',

  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reversed_at TIMESTAMPTZ,

  reversed_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  reversal_note TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_verified_sales_status_check
    CHECK (status IN ('active', 'reversed')),

  CONSTRAINT partner_verified_sales_reversal_shape_check
    CHECK (
      (status = 'active' AND reversed_at IS NULL)
      OR
      (status = 'reversed' AND reversed_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS partner_verified_sales_rep_status_idx
  ON partner_verified_sales (
    representative_id,
    status,
    added_at DESC
  );

CREATE UNIQUE INDEX IF NOT EXISTS partner_verified_sales_active_reference_unique
  ON partner_verified_sales (
    representative_id,
    LOWER(reference)
  )
  WHERE status = 'active' AND reference IS NOT NULL;

/* =========================================================
   REPRESENTATIVE EMAIL-CHANGE CHALLENGES

   Codes are stored only as keyed hashes. A challenge proves
   the current address first, then a separately supplied new
   address. Completed/expired rows remain as a security audit.
   ========================================================= */

CREATE TABLE IF NOT EXISTS representative_email_change_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE CASCADE,

  current_email VARCHAR(255) NOT NULL,
  current_email_normalized VARCHAR(255) NOT NULL,

  current_code_hash CHAR(64) NOT NULL,
  current_code_digest CHAR(64) NOT NULL,
  current_code_expires_at TIMESTAMPTZ NOT NULL,
  current_code_attempts INTEGER NOT NULL DEFAULT 0,
  current_code_last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_code_verified_at TIMESTAMPTZ,

  new_email VARCHAR(255),
  new_email_normalized VARCHAR(255),
  new_code_hash CHAR(64),
  new_code_digest CHAR(64),
  new_code_expires_at TIMESTAMPTZ,
  new_code_attempts INTEGER NOT NULL DEFAULT 0,
  new_code_last_sent_at TIMESTAMPTZ,
  new_code_verified_at TIMESTAMPTZ,

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT representative_email_change_current_attempts_check
    CHECK (current_code_attempts BETWEEN 0 AND 5),

  CONSTRAINT representative_email_change_new_attempts_check
    CHECK (new_code_attempts BETWEEN 0 AND 5),

  CONSTRAINT representative_email_change_new_code_shape_check
    CHECK (
      (
        new_code_hash IS NULL
        AND new_code_digest IS NULL
        AND new_code_expires_at IS NULL
        AND new_code_last_sent_at IS NULL
      )
      OR
      (
        new_email IS NOT NULL
        AND new_email_normalized IS NOT NULL
        AND new_code_hash IS NOT NULL
        AND new_code_digest IS NOT NULL
        AND new_code_expires_at IS NOT NULL
        AND new_code_last_sent_at IS NOT NULL
      )
    )
);

CREATE INDEX IF NOT EXISTS representative_email_change_active_idx
  ON representative_email_change_challenges (
    representative_id,
    created_at DESC
  )
  WHERE completed_at IS NULL;

/* =========================================================
   IDEMPOTENT PROGRAM COMPLETION EMAIL DELIVERY

   This table is delivery state, not a second Program-progress
   system. Its unique key remains stable even if an earned
   reward record is later corrected or removed.
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_program_completion_emails (
  program_id UUID NOT NULL
    REFERENCES partner_programs(id)
    ON DELETE CASCADE,

  representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE CASCADE,

  sent_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (program_id, representative_id),

  CONSTRAINT partner_program_completion_email_attempts_check
    CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS partner_program_completion_email_retry_idx
  ON partner_program_completion_emails (
    sent_at,
    last_attempt_at
  )
  WHERE sent_at IS NULL;

COMMIT;
