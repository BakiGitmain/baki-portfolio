BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  username VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,

  password_hash TEXT NOT NULL,

  role VARCHAR(20) NOT NULL DEFAULT 'admin',

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,

  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT admins_role_check
    CHECK (role = 'admin')
);

CREATE UNIQUE INDEX IF NOT EXISTS
  admins_username_unique_lower
ON admins (LOWER(username));

CREATE UNIQUE INDEX IF NOT EXISTS
  admins_email_unique_lower
ON admins (LOWER(email));

COMMIT;