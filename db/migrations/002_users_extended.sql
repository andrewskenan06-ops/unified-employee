-- Extend users with employee profile fields

ALTER TABLE users ADD COLUMN IF NOT EXISTS pin             TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email           TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone           TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS start_date      DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'full-time';
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_name  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status          TEXT DEFAULT 'active';
