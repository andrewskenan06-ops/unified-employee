-- Employee overtime tracking (hours over 60 paid at 1.5x)

CREATE TABLE IF NOT EXISTS employee_overtime (
  id            SERIAL      PRIMARY KEY,
  employee_id   TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start    DATE        NOT NULL,
  week_end      DATE        NOT NULL,
  overtime_hours NUMERIC    NOT NULL DEFAULT 0,
  overtime_rate  NUMERIC    NOT NULL DEFAULT 0,
  overtime_pay   NUMERIC    NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
