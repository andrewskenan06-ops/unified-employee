-- ============================================================
-- Unified Employee Platform — Neon PostgreSQL Schema
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
-- Replaces the hardcoded USERS array in lib/auth.js
CREATE TABLE users (
  id          TEXT        PRIMARY KEY,           -- e.g. "emp_1", "adm_1"
  username    TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,              -- store hashed (bcrypt) in production
  name        TEXT        NOT NULL,
  role        TEXT        NOT NULL CHECK (role IN ('employee', 'admin')),
  job_role    TEXT        CHECK (job_role IN ('Office Worker', 'Yard Worker', 'Truck Driver', 'Dirt Manager')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Time Records ─────────────────────────────────────────────
-- Replaces ue_time_records in localStorage
CREATE TABLE time_records (
  id              SERIAL      PRIMARY KEY,
  employee_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clock_in        TIMESTAMPTZ NOT NULL,
  clock_out       TIMESTAMPTZ,
  clock_in_lat    NUMERIC(10, 7),
  clock_in_lng    NUMERIC(10, 7),
  clock_out_lat   NUMERIC(10, 7),
  clock_out_lng   NUMERIC(10, 7),
  flagged         BOOLEAN     NOT NULL DEFAULT FALSE, -- TRUE if clocked in outside geofence
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_time_records_employee ON time_records(employee_id);
CREATE INDEX idx_time_records_clock_in ON time_records(clock_in);

-- ── Saturday Schedule ────────────────────────────────────────
-- Replaces ue_schedule in localStorage
CREATE TABLE schedule_slots (
  id          SERIAL      PRIMARY KEY,
  date        DATE        NOT NULL,              -- e.g. 2026-04-18
  employee_id TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_by    TEXT        REFERENCES users(id),  -- NULL = self-scheduled, admin id = admin-added
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (date, employee_id)                     -- one slot per person per Saturday
);

CREATE INDEX idx_schedule_slots_date ON schedule_slots(date);

-- ── Seed Data ────────────────────────────────────────────────
INSERT INTO users (id, username, password, name, role, job_role) VALUES
  ('emp_1', 'jordan',  'pass123',  'Jordan Lee',     'employee', 'Yard Worker'),
  ('emp_2', 'sam',     'pass123',  'Sam Torres',     'employee', 'Office Worker'),
  ('emp_3', 'morgan',  'pass123',  'Morgan Davis',   'employee', 'Truck Driver'),
  ('emp_4', 'justin',  'pass123',  'Justin Andrews', 'employee', 'Dirt Manager'),
  ('emp_5', 'alex',    'pass123',  'Alex Rivera',    'employee', 'Yard Worker'),
  ('emp_6', 'taylor',  'pass123',  'Taylor Brooks',  'employee', 'Office Worker'),
  ('emp_7', 'casey',   'pass123',  'Casey Nguyen',   'employee', 'Truck Driver'),
  ('emp_8', 'riley',   'pass123',  'Riley Simmons',  'employee', 'Dirt Manager'),
  ('emp_9', 'drew',    'pass123',  'Drew Patel',     'employee', 'Yard Worker'),
  ('adm_1', 'admin',   'admin123', 'Admin',          'admin',    NULL);
