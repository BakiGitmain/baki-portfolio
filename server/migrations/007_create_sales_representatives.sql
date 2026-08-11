BEGIN;

CREATE SEQUENCE IF NOT EXISTS
  sales_representative_number_seq
START WITH 1001
INCREMENT BY 1;

/* =========================================================
   REPRESENTATIVES
   ========================================================= */

CREATE TABLE IF NOT EXISTS sales_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  application_id UUID NOT NULL UNIQUE
    REFERENCES sales_representative_applications(id)
    ON DELETE RESTRICT,

  representative_number BIGINT NOT NULL UNIQUE,

  username VARCHAR(32) NOT NULL,

  name VARCHAR(160) NOT NULL,
  father_name VARCHAR(160) NOT NULL,

  email VARCHAR(255) NOT NULL,
  email_normalized VARCHAR(255) NOT NULL,

  phone VARCHAR(40) NOT NULL,
  phone_normalized VARCHAR(40) NOT NULL,

  city VARCHAR(120) NOT NULL,
  address VARCHAR(255) NOT NULL,

  telegram VARCHAR(160),
  whatsapp VARCHAR(40),

  password_hash TEXT NOT NULL,

  role VARCHAR(32) NOT NULL
    DEFAULT 'representative',

  must_change_password BOOLEAN NOT NULL
    DEFAULT TRUE,

  is_active BOOLEAN NOT NULL
    DEFAULT TRUE,

  failed_login_attempts INTEGER NOT NULL
    DEFAULT 0,

  locked_until TIMESTAMPTZ,

  session_version INTEGER NOT NULL
    DEFAULT 1,

  last_login_at TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,

  accepted_by_admin_id UUID
    REFERENCES admins(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT sales_representatives_role_check
    CHECK (role = 'representative')
);

CREATE UNIQUE INDEX IF NOT EXISTS
  sales_representatives_username_unique_lower
ON sales_representatives (
  LOWER(username)
);

CREATE UNIQUE INDEX IF NOT EXISTS
  sales_representatives_email_unique
ON sales_representatives (
  email_normalized
);

CREATE UNIQUE INDEX IF NOT EXISTS
  sales_representatives_phone_unique
ON sales_representatives (
  phone_normalized
);

CREATE INDEX IF NOT EXISTS
  sales_representatives_active_idx
ON sales_representatives (
  is_active,
  created_at DESC
);

/* =========================================================
   REPRESENTATIVE REPORTS
   ========================================================= */

CREATE TABLE IF NOT EXISTS representative_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE CASCADE,

  category VARCHAR(32) NOT NULL,

  title VARCHAR(160) NOT NULL,

  business_name VARCHAR(180) NOT NULL,

  contact_name VARCHAR(160),

  client_phone VARCHAR(40),
  client_email VARCHAR(255),

  estimated_budget NUMERIC(14, 2),

  details TEXT NOT NULL,

  status VARCHAR(32) NOT NULL
    DEFAULT 'submitted',

  admin_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT representative_reports_category_check
    CHECK (
      category IN (
        'lead',
        'follow_up',
        'meeting',
        'issue',
        'other'
      )
    ),

  CONSTRAINT representative_reports_status_check
    CHECK (
      status IN (
        'submitted',
        'reviewing',
        'contacted',
        'qualified',
        'won',
        'lost',
        'closed'
      )
    ),

  CONSTRAINT representative_reports_budget_check
    CHECK (
      estimated_budget IS NULL
      OR estimated_budget >= 0
    )
);

CREATE INDEX IF NOT EXISTS
  representative_reports_owner_idx
ON representative_reports (
  representative_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  representative_reports_status_idx
ON representative_reports (
  status,
  created_at DESC
);

/* =========================================================
   TRAINING MODULES
   ========================================================= */

CREATE TABLE IF NOT EXISTS representative_training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  slug VARCHAR(120) NOT NULL UNIQUE,

  title VARCHAR(180) NOT NULL,

  description TEXT NOT NULL,

  content TEXT NOT NULL,

  video_url TEXT,

  duration_minutes INTEGER NOT NULL
    DEFAULT 10,

  sort_order INTEGER NOT NULL
    DEFAULT 0,

  is_required BOOLEAN NOT NULL
    DEFAULT TRUE,

  is_published BOOLEAN NOT NULL
    DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT representative_training_duration_check
    CHECK (duration_minutes > 0)
);

/* =========================================================
   TRAINING PROGRESS
   ========================================================= */

CREATE TABLE IF NOT EXISTS representative_training_progress (
  representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE CASCADE,

  module_id UUID NOT NULL
    REFERENCES representative_training_modules(id)
    ON DELETE CASCADE,

  progress_percent INTEGER NOT NULL
    DEFAULT 0,

  completed BOOLEAN NOT NULL
    DEFAULT FALSE,

  completed_at TIMESTAMPTZ,

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  PRIMARY KEY (
    representative_id,
    module_id
  ),

  CONSTRAINT representative_training_progress_check
    CHECK (
      progress_percent >= 0
      AND progress_percent <= 100
    )
);

/* =========================================================
   RESOURCES
   ========================================================= */

CREATE TABLE IF NOT EXISTS representative_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  slug VARCHAR(120) NOT NULL UNIQUE,

  category VARCHAR(80) NOT NULL,

  title VARCHAR(180) NOT NULL,

  description TEXT NOT NULL,

  content TEXT NOT NULL,

  external_url TEXT,

  sort_order INTEGER NOT NULL
    DEFAULT 0,

  is_published BOOLEAN NOT NULL
    DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW()
);

/* =========================================================
   STARTER TRAINING
   ========================================================= */

INSERT INTO representative_training_modules (
  slug,
  title,
  description,
  content,
  duration_minutes,
  sort_order,
  is_required,
  is_published
)
VALUES
(
  'sales-role-foundations',

  'Sales Representative Foundations',

  'Understand your role, responsibilities and how the sales process works.',

  'Your role is to find qualified businesses or individuals who may need a professional website, communicate professionally, understand their basic needs and connect serious prospects with Baki. You must never pretend to be the developer or make technical promises that have not been approved.',

  12,
  1,
  TRUE,
  TRUE
),
(
  'qualifying-a-client',

  'How to Qualify a Client',

  'Learn how to identify serious prospects before handing them over.',

  'A qualified prospect has a real need, a realistic budget, decision-making authority or access to the decision maker, and reasonable interest in discussing the project. Ask what they need, why they need it, when they want it and what type of business or organization they operate.',

  15,
  2,
  TRUE,
  TRUE
),
(
  'pricing-and-promises',

  'Pricing, Promises & Handoff',

  'Learn what you can discuss and what must be confirmed by Baki.',

  'Never invent discounts, delivery dates, features or guarantees. You may explain the normal pricing ranges and service categories, but final requirements, exact pricing, technical commitments and delivery agreements are confirmed directly by Baki.',

  10,
  3,
  TRUE,
  TRUE
)
ON CONFLICT (slug)
DO NOTHING;

/* =========================================================
   STARTER RESOURCES
   ========================================================= */

INSERT INTO representative_resources (
  slug,
  category,
  title,
  description,
  content,
  sort_order,
  is_published
)
VALUES
(
  'pricing-reference',

  'Pricing',

  'Pricing Reference',

  'Quick reference for normal website pricing ranges.',

  'Frontend-only and simple websites normally begin around ETB 35,000. More advanced frontend work may reach ETB 45,000. Simple backend systems and catalog-style websites can be around ETB 50,000 to 60,000. More advanced reporting, sales systems and analytics can move toward ETB 70,000 or more. Ecommerce commonly begins around ETB 80,000 to 90,000, while advanced delivery and workflow systems can exceed ETB 100,000. Final pricing is always confirmed after requirements are reviewed.',

  1,
  TRUE
),
(
  'commission-reference',

  'Commission',

  'Commission Reference',

  'Understand when and how commission is earned.',

  'Qualifying completed sales from ETB 35,000 through ETB 50,000 earn 20 percent commission. Sales strictly above ETB 50,000 earn 25 percent. Commission becomes payable only after the qualifying customer payment has successfully cleared and the sale is confirmed. Cancelled, refunded or reversed transactions do not generate commission.',

  2,
  TRUE
),
(
  'sales-conduct',

  'Rules',

  'Professional Conduct',

  'Important rules for representing the service professionally.',

  'Never collect customer money. Never invent prices, discounts, features or deadlines. Do not spam, impersonate people or use misleading claims. Protect customer information and communicate professionally. Serious prospects should be handed directly to Baki for requirements, technical discussion and final agreement.',

  3,
  TRUE
)
ON CONFLICT (slug)
DO NOTHING;

COMMIT;