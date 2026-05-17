-- Tasks, financial entries, report metrics, and checklist questions

CREATE TABLE IF NOT EXISTS tasks (
  id           SERIAL       PRIMARY KEY,
  title        TEXT         NOT NULL,
  description  TEXT,
  assigned_to  TEXT         REFERENCES users(id) ON DELETE SET NULL,
  created_by   TEXT         REFERENCES users(id) ON DELETE SET NULL,
  due_date     DATE,
  priority     VARCHAR(20)  NOT NULL DEFAULT 'medium',
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS financial_entries (
  id         SERIAL       PRIMARY KEY,
  section    VARCHAR(50)  NOT NULL,
  label      TEXT         NOT NULL,
  amount     NUMERIC      NOT NULL DEFAULT 0,
  month      DATE         NOT NULL DEFAULT DATE_TRUNC('month', NOW()),
  notes      TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_metrics (
  id           SERIAL       PRIMARY KEY,
  category     VARCHAR(50)  NOT NULL,
  metric_key   VARCHAR(100) NOT NULL,
  metric_label VARCHAR(100) NOT NULL,
  value        NUMERIC,
  format       VARCHAR(20)  NOT NULL DEFAULT 'num',
  change_pct   NUMERIC,
  change_label VARCHAR(100),
  sub_label    VARCHAR(100),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_questions (
  id         SERIAL      PRIMARY KEY,
  job_role   TEXT        NOT NULL,
  direction  TEXT        NOT NULL CHECK (direction IN ('in', 'out')),
  message    TEXT        NOT NULL,
  type       TEXT        NOT NULL DEFAULT 'confirm',
  button_text TEXT       NOT NULL DEFAULT 'Okay',
  sort_order INTEGER     NOT NULL DEFAULT 0,
  video_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
