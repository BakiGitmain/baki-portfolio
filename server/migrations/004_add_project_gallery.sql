BEGIN;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS gallery JSONB;

UPDATE projects
SET gallery = '[]'::JSONB
WHERE gallery IS NULL;

ALTER TABLE projects
ALTER COLUMN gallery
SET DEFAULT '[]'::JSONB;

ALTER TABLE projects
ALTER COLUMN gallery
SET NOT NULL;

ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_gallery_array_check;

ALTER TABLE projects
ADD CONSTRAINT projects_gallery_array_check
CHECK (
  jsonb_typeof(gallery) = 'array'
  AND jsonb_array_length(gallery) <= 5
);

COMMIT;