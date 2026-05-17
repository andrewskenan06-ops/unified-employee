-- Per-employee geofence enforcement and mobile clock-in settings

ALTER TABLE users ADD COLUMN IF NOT EXISTS require_geofence      BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_mobile_anywhere BOOLEAN NOT NULL DEFAULT FALSE;
