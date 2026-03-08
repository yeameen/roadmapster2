-- Add holidays array and make start/end dates required.
-- working_days is now computed from dates + holidays in the application layer
-- but kept in the DB for query convenience.

ALTER TABLE quarters
  ADD COLUMN holidays text[] NOT NULL DEFAULT '{}';

-- Backfill any null dates with sensible defaults before making them NOT NULL.
-- Use current quarter boundaries as placeholder for existing rows.
UPDATE quarters SET start_date = CURRENT_DATE WHERE start_date IS NULL;
UPDATE quarters SET end_date = CURRENT_DATE + INTERVAL '90 days' WHERE end_date IS NULL;

ALTER TABLE quarters
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date SET NOT NULL;
