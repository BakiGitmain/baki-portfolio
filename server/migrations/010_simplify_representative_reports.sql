BEGIN;

/* =========================================================
   SIMPLIFIED REPRESENTATIVE REPORTS

   Keep the existing table and IDs so production history is
   preserved. Legacy CRM fields remain available for old data
   but are no longer required by the simplified message flow.
   ========================================================= */

ALTER TABLE representative_reports
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS admin_read_at TIMESTAMPTZ;

UPDATE representative_reports
SET message = CONCAT_WS(
  E'\n\n',
  NULLIF(TRIM(title), ''),
  CASE
    WHEN NULLIF(TRIM(business_name), '') IS NOT NULL
      THEN 'Business: ' || TRIM(business_name)
    ELSE NULL
  END,
  NULLIF(TRIM(details), '')
)
WHERE message IS NULL;

UPDATE representative_reports
SET message = 'Legacy report'
WHERE message IS NULL OR TRIM(message) = '';

ALTER TABLE representative_reports
  ALTER COLUMN message SET NOT NULL,
  ALTER COLUMN category DROP NOT NULL,
  ALTER COLUMN title DROP NOT NULL,
  ALTER COLUMN business_name DROP NOT NULL,
  ALTER COLUMN details DROP NOT NULL;

CREATE INDEX IF NOT EXISTS
  representative_reports_admin_unread_idx
ON representative_reports (
  created_at DESC
)
WHERE admin_read_at IS NULL;

/* =========================================================
   ADMIN REPLIES
   ========================================================= */

CREATE TABLE IF NOT EXISTS representative_report_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_id UUID NOT NULL
    REFERENCES representative_reports(id)
    ON DELETE CASCADE,

  admin_user_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  message TEXT NOT NULL,

  representative_read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT representative_report_replies_message_check
    CHECK (
      CHAR_LENGTH(TRIM(message)) BETWEEN 1 AND 5000
    )
);

CREATE INDEX IF NOT EXISTS
  representative_report_replies_report_idx
ON representative_report_replies (
  report_id,
  created_at ASC
);

CREATE INDEX IF NOT EXISTS
  representative_report_replies_unread_idx
ON representative_report_replies (
  report_id,
  created_at DESC
)
WHERE representative_read_at IS NULL;

/* =========================================================
   INACTIVITY REMINDERS
   ========================================================= */

ALTER TABLE sales_representatives
  ADD COLUMN IF NOT EXISTS last_report_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS
  sales_representatives_report_reminder_idx
ON sales_representatives (
  last_report_reminder_sent_at,
  created_at
)
WHERE is_active = TRUE;

COMMIT;
