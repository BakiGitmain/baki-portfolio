BEGIN;

CREATE TABLE IF NOT EXISTS representative_training_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  representative_id UUID NOT NULL
    REFERENCES sales_representatives(id)
    ON DELETE CASCADE,

  lesson_id UUID NOT NULL
    REFERENCES training_lessons(id)
    ON DELETE CASCADE,

  last_position_seconds INTEGER NOT NULL DEFAULT 0,

  completed BOOLEAN NOT NULL DEFAULT FALSE,

  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT representative_training_lesson_progress_position_check
    CHECK (last_position_seconds >= 0),

  CONSTRAINT representative_training_lesson_progress_unique
    UNIQUE (
      representative_id,
      lesson_id
    )
);

CREATE INDEX IF NOT EXISTS representative_training_lesson_progress_rep_idx
  ON representative_training_lesson_progress (
    representative_id
  );

CREATE INDEX IF NOT EXISTS representative_training_lesson_progress_lesson_idx
  ON representative_training_lesson_progress (
    lesson_id
  );

CREATE INDEX IF NOT EXISTS representative_training_lesson_progress_completed_idx
  ON representative_training_lesson_progress (
    representative_id,
    completed
  );

COMMIT;