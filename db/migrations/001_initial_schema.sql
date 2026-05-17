-- Initial schema: users, time_records, schedule_slots

CREATE TABLE IF NOT EXISTS users (
  id          TEXT        PRIMARY KEY,
  username    TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  role        TEXT        NOT NULL CHECK (role IN ('employee', 'admin')),
  job_role    TEXT        CHECK (job_role IN ('Office Worker', 'Yard Worker', 'Truck Driver', 'Dirt Manager')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_records (
  id           SERIAL      PRIMARY KEY,
  employee_id  TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clock_in     TIMESTAMPTZ NOT NULL,
  clock_out    TIMESTAMPTZ,
  clock_in_lat  NUMERIC(10,7),
  clock_in_lng  NUMERIC(10,7),
  clock_out_lat NUMERIC(10,7),
  clock_out_lng NUMERIC(10,7),
  flagged      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_records_employee ON time_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_records_clock_in ON time_records(clock_in);

CREATE TABLE IF NOT EXISTS schedule_slots (
  id          SERIAL      PRIMARY KEY,
  date        DATE        NOT NULL,
  employee_id TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_by    TEXT        REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (date, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_schedule_slots_date ON schedule_slots(date);
