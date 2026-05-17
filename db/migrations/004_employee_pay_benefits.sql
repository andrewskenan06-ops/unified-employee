-- Employee pay, benefits, and deductions tables

CREATE TABLE IF NOT EXISTS employee_pay (
  employee_id  TEXT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pay_type     TEXT        NOT NULL DEFAULT 'hourly',
  pay_rate     NUMERIC     NOT NULL,
  pay_period   TEXT        NOT NULL DEFAULT 'weekly',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_benefits (
  employee_id    TEXT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  health_plan    TEXT        NOT NULL DEFAULT 'none',
  dental         BOOLEAN     NOT NULL DEFAULT FALSE,
  vision         BOOLEAN     NOT NULL DEFAULT FALSE,
  retirement_pct NUMERIC     NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_deductions (
  employee_id          TEXT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  federal_tax          BOOLEAN     NOT NULL DEFAULT TRUE,
  state_tax            BOOLEAN     NOT NULL DEFAULT TRUE,
  social_security      BOOLEAN     NOT NULL DEFAULT TRUE,
  medicare             BOOLEAN     NOT NULL DEFAULT TRUE,
  benefits             BOOLEAN     NOT NULL DEFAULT TRUE,
  child_support        BOOLEAN     NOT NULL DEFAULT FALSE,
  child_support_amount NUMERIC     NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_hours (
  id           SERIAL  PRIMARY KEY,
  employee_id  TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start   DATE    NOT NULL,
  week_end     DATE    NOT NULL,
  hours_worked NUMERIC NOT NULL DEFAULT 0,
  regular_hours NUMERIC NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
