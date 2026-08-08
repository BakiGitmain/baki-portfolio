BEGIN;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS project_year VARCHAR(20);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS role_en TEXT;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS role_am TEXT;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS display_status_en VARCHAR(100);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS display_status_am VARCHAR(100);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS overview_en TEXT;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS overview_am TEXT;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS challenge_en TEXT;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS challenge_am TEXT;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS solution_en TEXT;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS solution_am TEXT;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS how_it_works JSONB;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS features JSONB;

/* ---------------------------------------------------------
   BACKFILL EXISTING PROJECTS
   --------------------------------------------------------- */

UPDATE projects
SET
  project_year = COALESCE(
    project_year,
    EXTRACT(YEAR FROM created_at)::TEXT
  ),

  role_en = COALESCE(
    role_en,
    'Full-Stack Development'
  ),

  role_am = COALESCE(
    role_am,
    'Full-Stack ልማት'
  ),

  display_status_en = COALESCE(
    display_status_en,
    'Completed'
  ),

  display_status_am = COALESCE(
    display_status_am,
    'ተጠናቋል'
  ),

  overview_en = COALESCE(
    overview_en,
    description_en
  ),

  overview_am = COALESCE(
    overview_am,
    description_am
  ),

  challenge_en = COALESCE(
    challenge_en,
    description_en
  ),

  challenge_am = COALESCE(
    challenge_am,
    description_am
  ),

  solution_en = COALESCE(
    solution_en,
    description_en
  ),

  solution_am = COALESCE(
    solution_am,
    description_am
  ),

  how_it_works = COALESCE(
    how_it_works,
    '[]'::JSONB
  ),

  features = COALESCE(
    features,
    '[]'::JSONB
  );

/* ---------------------------------------------------------
   DEFAULTS
   --------------------------------------------------------- */

ALTER TABLE projects
ALTER COLUMN role_en
SET DEFAULT 'Full-Stack Development';

ALTER TABLE projects
ALTER COLUMN role_am
SET DEFAULT 'Full-Stack ልማት';

ALTER TABLE projects
ALTER COLUMN display_status_en
SET DEFAULT 'Completed';

ALTER TABLE projects
ALTER COLUMN display_status_am
SET DEFAULT 'ተጠናቋል';

ALTER TABLE projects
ALTER COLUMN how_it_works
SET DEFAULT '[]'::JSONB;

ALTER TABLE projects
ALTER COLUMN features
SET DEFAULT '[]'::JSONB;

/* ---------------------------------------------------------
   NOT NULL
   --------------------------------------------------------- */

ALTER TABLE projects
ALTER COLUMN project_year
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN role_en
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN role_am
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN display_status_en
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN display_status_am
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN overview_en
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN overview_am
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN challenge_en
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN challenge_am
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN solution_en
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN solution_am
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN how_it_works
SET NOT NULL;

ALTER TABLE projects
ALTER COLUMN features
SET NOT NULL;

COMMIT;