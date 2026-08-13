BEGIN;

/* =========================================================
   PARTNER PROGRAM SCHEMA RECONCILIATION

   Migration 015 originally referenced starts_at while the
   canonical Programs schema has always used start_date. Some
   environments may therefore have recorded or deployed an
   incomplete Programs upgrade. Reconcile only the additive
   challenge/reward and soft-deletion fields used by the current
   backend. Existing Program rows and their date fields are kept.
   ========================================================= */

ALTER TABLE partner_programs
  ADD COLUMN IF NOT EXISTS instructions TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reward_type VARCHAR(32) NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS reward_value NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS reward_scope VARCHAR(32),
  ADD COLUMN IF NOT EXISTS reward_description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by_admin_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'partner_programs'::regclass
      AND conname = 'partner_programs_deleted_by_admin_id_fkey'
  ) THEN
    ALTER TABLE partner_programs
      ADD CONSTRAINT partner_programs_deleted_by_admin_id_fkey
      FOREIGN KEY (deleted_by_admin_id)
      REFERENCES admins(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'partner_programs'::regclass
      AND conname = 'partner_programs_reward_type_check'
  ) THEN
    ALTER TABLE partner_programs
      ADD CONSTRAINT partner_programs_reward_type_check
      CHECK (reward_type IN ('bonus_commission', 'fixed_etb', 'none'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'partner_programs'::regclass
      AND conname = 'partner_programs_reward_scope_check'
  ) THEN
    ALTER TABLE partner_programs
      ADD CONSTRAINT partner_programs_reward_scope_check
      CHECK (
        reward_scope IS NULL
        OR reward_scope IN ('next_qualifying_sale', 'challenge_sale')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'partner_programs'::regclass
      AND conname = 'partner_programs_reward_shape_check'
  ) THEN
    ALTER TABLE partner_programs
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
  END IF;
END
$$;

DROP INDEX IF EXISTS partner_programs_active_list_idx;

CREATE INDEX partner_programs_active_list_idx
  ON partner_programs (status, start_date DESC, created_at DESC)
  WHERE deleted_at IS NULL;

COMMIT;
