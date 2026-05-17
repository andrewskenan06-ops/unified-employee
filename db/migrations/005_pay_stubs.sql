-- Pay stubs table

CREATE TABLE IF NOT EXISTS pay_stubs (
  id                  SERIAL      PRIMARY KEY,
  employee_id         TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start        DATE        NOT NULL,
  period_end          DATE        NOT NULL,
  hours_worked        NUMERIC,
  regular_hours       NUMERIC,
  overtime_hours      NUMERIC     NOT NULL DEFAULT 0,
  gross_pay           NUMERIC     NOT NULL,
  regular_pay         NUMERIC     NOT NULL,
  overtime_pay        NUMERIC     NOT NULL DEFAULT 0,
  federal_tax         NUMERIC     NOT NULL,
  state_tax           NUMERIC     NOT NULL,
  social_security     NUMERIC     NOT NULL,
  medicare            NUMERIC     NOT NULL,
  benefits_deduction  NUMERIC     NOT NULL DEFAULT 0,
  net_pay             NUMERIC     NOT NULL,
  paid_at             TIMESTAMPTZ
);
