BEGIN;

/* =========================================================
   SALES REPRESENTATIVE APPLICATIONS
   ========================================================= */

CREATE TABLE IF NOT EXISTS sales_representative_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  /*
    Internal numeric sequence.

    Public application references will look like:

    APP-1001
    APP-1002
    APP-1003

    Representative usernames such as PS-4821 are a
    DIFFERENT thing and will be created later when an
    applicant is accepted.
  */

  application_number BIGINT
    GENERATED ALWAYS AS IDENTITY (
      START WITH 1001
    )
    UNIQUE,

  /* =======================================================
     PERSONAL INFORMATION
     ======================================================= */

  full_name VARCHAR(160) NOT NULL,

  father_name VARCHAR(160) NOT NULL,

  email VARCHAR(254) NOT NULL,

  email_normalized VARCHAR(254) NOT NULL,

  phone VARCHAR(40) NOT NULL,

  phone_normalized VARCHAR(32) NOT NULL,

  city VARCHAR(120) NOT NULL,

  address VARCHAR(255) NOT NULL,

  /* =======================================================
     CONTACT
     ======================================================= */

  telegram VARCHAR(160),

  whatsapp VARCHAR(40),

  /* =======================================================
     APPLICATION
     ======================================================= */

  motivation VARCHAR(200) NOT NULL,

  /* =======================================================
     IDENTIFICATION

     IMPORTANT:

     We store Cloudinary public IDs only.

     We do NOT store public delivery URLs.

     The assets themselves are uploaded using Cloudinary's
     authenticated delivery type.
     ======================================================= */

  id_type VARCHAR(100) NOT NULL,

  id_upload_id UUID NOT NULL,

  id_front_public_id TEXT NOT NULL,

  id_front_format VARCHAR(20) NOT NULL,

  id_back_public_id TEXT NOT NULL,

  id_back_format VARCHAR(20) NOT NULL,

  /* =======================================================
     STATUS
     ======================================================= */

  status VARCHAR(20) NOT NULL
    DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'reviewing',
        'accepted',
        'rejected',
        'archived'
      )
    ),

  admin_notes TEXT NOT NULL
    DEFAULT '',

  /* =======================================================
     RULE AGREEMENT
     ======================================================= */

  rules_accepted BOOLEAN NOT NULL
    DEFAULT FALSE
    CHECK (
      rules_accepted = TRUE
    ),

  rules_accepted_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  /* =======================================================
     ABUSE / AUDIT INFORMATION

     Raw IP and User-Agent values are NOT stored.

     Only hashes are stored.
     ======================================================= */

  submission_ip_hash CHAR(64),

  user_agent_hash CHAR(64),

  /* =======================================================
     REVIEW
     ======================================================= */

  reviewed_at TIMESTAMPTZ,

  reviewed_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  /* =======================================================
     TIMESTAMPS
     ======================================================= */

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW()
);

/* =========================================================
   INDEXES
   ========================================================= */

CREATE INDEX IF NOT EXISTS
  sales_rep_applications_status_created_index
ON sales_representative_applications (
  status,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  sales_rep_applications_email_index
ON sales_representative_applications (
  email_normalized
);

CREATE INDEX IF NOT EXISTS
  sales_rep_applications_phone_index
ON sales_representative_applications (
  phone_normalized
);

CREATE INDEX IF NOT EXISTS
  sales_rep_applications_created_index
ON sales_representative_applications (
  created_at DESC
);

COMMIT;