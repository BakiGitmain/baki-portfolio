BEGIN;

/* =========================================================
   PROGRAM CHALLENGE + REWARD CONFIGURATION

   Existing partner_programs and automatic targets remain the
   source of truth. These columns add the human-facing challenge
   instructions and one simple reward definition per Program.
   ========================================================= */

ALTER TABLE partner_programs
  ADD COLUMN IF NOT EXISTS instructions TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reward_type VARCHAR(32) NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS reward_value NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS reward_scope VARCHAR(32),
  ADD COLUMN IF NOT EXISTS reward_description TEXT NOT NULL DEFAULT '';

ALTER TABLE partner_programs
  DROP CONSTRAINT IF EXISTS partner_programs_reward_type_check,
  DROP CONSTRAINT IF EXISTS partner_programs_reward_scope_check,
  DROP CONSTRAINT IF EXISTS partner_programs_reward_shape_check;

ALTER TABLE partner_programs
  ADD CONSTRAINT partner_programs_reward_type_check
    CHECK (reward_type IN ('bonus_commission', 'fixed_etb', 'none')),
  ADD CONSTRAINT partner_programs_reward_scope_check
    CHECK (
      reward_scope IS NULL
      OR reward_scope IN ('next_qualifying_sale', 'challenge_sale')
    ),
  ADD CONSTRAINT partner_programs_reward_shape_check
    CHECK (
      (
        reward_type = 'bonus_commission'
        AND reward_value > 0
        AND reward_value <= 100
        AND reward_scope IS NOT NULL
      )
      OR (
        reward_type = 'fixed_etb'
        AND reward_value > 0
        AND reward_scope IS NULL
      )
      OR (
        reward_type = 'none'
        AND reward_value IS NULL
        AND reward_scope IS NULL
      )
    );

/* =========================================================
   GOAL TYPES

   reports / lessons / course_completion are preserved.
   leads_submitted is system-recorded and completes immediately;
   the verified challenge types require a trusted backend event
   or explicit administrator approval.
   ========================================================= */

ALTER TABLE partner_program_targets
  DROP CONSTRAINT IF EXISTS partner_program_targets_type_check;

ALTER TABLE partner_program_targets
  ADD CONSTRAINT partner_program_targets_type_check
    CHECK (
      target_type IN (
        'reports',
        'lessons',
        'course_completion',
        'leads_submitted',
        'qualified_lead',
        'confirmed_sale',
        'partner_referral',
        'custom_challenge'
      )
    );

/* =========================================================
   CHALLENGE SUBMISSIONS

   Partner ownership is derived from the authenticated session.
   normalized_contact_hash supports exact duplicate blocking
   without placing normalized private contact data in an index.
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_program_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  program_id UUID NOT NULL
    REFERENCES partner_programs(id)
    ON DELETE CASCADE,

  target_id UUID NOT NULL
    REFERENCES partner_program_targets(id)
    ON DELETE CASCADE,

  representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE CASCADE,

  submission_type VARCHAR(32) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',

  business_name VARCHAR(180),
  contact_name VARCHAR(160),
  contact_method VARCHAR(255),
  business_type VARCHAR(120),
  need_summary VARCHAR(500),
  notes TEXT NOT NULL DEFAULT '',
  explanation TEXT NOT NULL DEFAULT '',
  public_url TEXT,

  normalized_contact_hash CHAR(64),

  sale_amount_etb NUMERIC(14, 2),
  sale_reference VARCHAR(120),
  sale_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  customer_payment_cleared BOOLEAN NOT NULL DEFAULT FALSE,

  rejection_reason TEXT,
  reviewed_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  admin_notification_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_program_submissions_type_check
    CHECK (
      submission_type IN (
        'leads_submitted',
        'qualified_lead',
        'confirmed_sale',
        'custom_challenge'
      )
    ),

  CONSTRAINT partner_program_submissions_status_check
    CHECK (status IN ('pending', 'approved', 'rejected')),

  CONSTRAINT partner_program_submissions_sale_amount_check
    CHECK (sale_amount_etb IS NULL OR sale_amount_etb >= 0),

  CONSTRAINT partner_program_submissions_review_shape_check
    CHECK (
      (status = 'pending' AND reviewed_at IS NULL)
      OR (status IN ('approved', 'rejected') AND reviewed_at IS NOT NULL)
    ),

  CONSTRAINT partner_program_submissions_rejection_check
    CHECK (
      status <> 'rejected'
      OR NULLIF(TRIM(rejection_reason), '') IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS partner_program_submissions_program_status_idx
  ON partner_program_submissions (program_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS partner_program_submissions_rep_created_idx
  ON partner_program_submissions (representative_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS partner_program_submissions_contact_unique
  ON partner_program_submissions (
    program_id,
    target_id,
    normalized_contact_hash
  )
  WHERE normalized_contact_hash IS NOT NULL;

/* =========================================================
   EARNED REWARD LEDGER

   Locked is represented by the Program reward before a ledger
   row exists. Rows begin at Earned and move only through explicit
   admin actions. One normalized sale reference can consume only
   one commission bonus, preventing automatic stacking.
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_program_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  program_id UUID NOT NULL
    REFERENCES partner_programs(id)
    ON DELETE CASCADE,

  representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE CASCADE,

  reward_type VARCHAR(32) NOT NULL,
  reward_value NUMERIC(14, 2),
  reward_scope VARCHAR(32),
  status VARCHAR(20) NOT NULL DEFAULT 'earned',

  associated_submission_id UUID
    REFERENCES partner_program_submissions(id)
    ON DELETE SET NULL,

  sale_reference VARCHAR(120),
  sale_reference_normalized VARCHAR(120),
  sale_amount_etb NUMERIC(14, 2),
  base_commission_percent NUMERIC(7, 2),
  effective_commission_percent NUMERIC(7, 2),

  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  paid_or_applied_at TIMESTAMPTZ,
  approved_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,
  completed_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,
  admin_note TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (program_id, representative_id),

  CONSTRAINT partner_program_rewards_type_check
    CHECK (reward_type IN ('bonus_commission', 'fixed_etb', 'none')),
  CONSTRAINT partner_program_rewards_scope_check
    CHECK (
      reward_scope IS NULL
      OR reward_scope IN ('next_qualifying_sale', 'challenge_sale')
    ),
  CONSTRAINT partner_program_rewards_status_check
    CHECK (status IN ('earned', 'approved', 'paid', 'applied')),
  CONSTRAINT partner_program_rewards_sale_amount_check
    CHECK (sale_amount_etb IS NULL OR sale_amount_etb >= 0)
);

CREATE INDEX IF NOT EXISTS partner_program_rewards_program_status_idx
  ON partner_program_rewards (program_id, status, earned_at DESC);

CREATE INDEX IF NOT EXISTS partner_program_rewards_rep_status_idx
  ON partner_program_rewards (representative_id, status, earned_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS partner_program_rewards_sale_once_unique
  ON partner_program_rewards (sale_reference_normalized)
  WHERE
    reward_type = 'bonus_commission'
    AND status = 'applied'
    AND sale_reference_normalized IS NOT NULL;

/* =========================================================
   REFERRAL ATTRIBUTION

   A referral is fixed at application creation. It only becomes
   eligible for challenge progress after acceptance and first-time
   account activation (must_change_password becomes false).
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  referring_representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE RESTRICT,

  application_id UUID NOT NULL UNIQUE
    REFERENCES sales_representative_applications(id)
    ON DELETE RESTRICT,

  referred_representative_id UUID UNIQUE
    REFERENCES sales_representatives(id)
    ON DELETE RESTRICT,

  status VARCHAR(20) NOT NULL DEFAULT 'attributed',
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  reviewed_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,
  disqualification_reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_referrals_status_check
    CHECK (
      status IN (
        'attributed',
        'accepted',
        'activated',
        'rejected',
        'disqualified'
      )
    )
);

CREATE INDEX IF NOT EXISTS partner_referrals_referrer_status_idx
  ON partner_referrals (
    referring_representative_id,
    status,
    attributed_at DESC
  );

/* =========================================================
   PROGRAM NOTIFICATIONS

   This is one reusable Programs notification stream, not a
   separate system per event. Badges are based on read_at.
   ========================================================= */

CREATE TABLE IF NOT EXISTS partner_program_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE CASCADE,

  program_id UUID NOT NULL
    REFERENCES partner_programs(id)
    ON DELETE CASCADE,

  event_type VARCHAR(40) NOT NULL,
  message_en VARCHAR(500) NOT NULL,
  message_am VARCHAR(500) NOT NULL,
  dedupe_key VARCHAR(180) NOT NULL UNIQUE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT partner_program_notifications_type_check
    CHECK (
      event_type IN (
        'assigned',
        'submission_approved',
        'submission_rejected',
        'completed',
        'reward_approved'
      )
    )
);

CREATE INDEX IF NOT EXISTS partner_program_notifications_rep_unread_idx
  ON partner_program_notifications (representative_id, created_at DESC)
  WHERE read_at IS NULL;

/* Backfill materialized assignment rows for current all-partner Programs.
   Existing dynamic assignment behavior remains valid as a fallback. */
INSERT INTO partner_program_assignments (
  program_id,
  representative_id,
  assigned_by_admin_id,
  assigned_at
)
SELECT
  program.id,
  representative.id,
  program.created_by_admin_id,
  program.created_at
FROM partner_programs program
INNER JOIN sales_representatives representative
  ON representative.is_active = TRUE
WHERE program.assignment_scope = 'everyone'
ON CONFLICT (program_id, representative_id)
DO NOTHING;

COMMIT;
