-- Add distance tracking and approval status to time_records

ALTER TABLE time_records ADD COLUMN IF NOT EXISTS clock_in_dist_ft  INTEGER;
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS clock_out_dist_ft INTEGER;
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS approved          BOOLEAN;
