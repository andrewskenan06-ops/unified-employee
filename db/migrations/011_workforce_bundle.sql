-- ============================================================
-- 011 — Workforce Bundle
-- All tables required by /api/workforce/* and lib/workforce/*
-- ============================================================

-- ── workforce_employees ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_employees (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_number     TEXT,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  preferred_name      TEXT,
  email               TEXT,
  phone               TEXT,
  department_id       UUID,
  position_id         UUID,
  employment_type     TEXT NOT NULL DEFAULT 'full_time',   -- full_time | part_time | contractor
  hire_date           DATE,
  photo_url           TEXT,
  geo_fence_enabled   BOOLEAN NOT NULL DEFAULT false,
  allow_mobile_clock  BOOLEAN NOT NULL DEFAULT true,
  pin_hash            TEXT,
  pin_attempts        INT NOT NULL DEFAULT 0,
  pin_locked_until    TIMESTAMPTZ,
  employment_status   TEXT NOT NULL DEFAULT 'active',      -- active | inactive | terminated
  pay_type            TEXT NOT NULL DEFAULT 'hourly',      -- hourly | salary
  pay_rate            NUMERIC(10,4),
  overtime_threshold  NUMERIC(5,2) NOT NULL DEFAULT 40,
  timezone            TEXT NOT NULL DEFAULT 'America/New_York',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workforce_employees_tenant ON workforce_employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workforce_employees_user   ON workforce_employees(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_workforce_employees_number
  ON workforce_employees(tenant_id, employee_number) WHERE employee_number IS NOT NULL;

-- ── workforce_clock_events ───────────────────────────────────
-- Raw punch events (clock_in / clock_out / break_start / break_end)
CREATE TABLE IF NOT EXISTS workforce_clock_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,           -- clock_in | clock_out | break_start | break_end
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  geo_accuracy_m  DOUBLE PRECISION,
  ip_address      TEXT,
  device_type     TEXT,
  user_agent      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clock_events_emp_date
  ON workforce_clock_events(employee_id, occurred_at DESC);

-- ── workforce_time_entries ───────────────────────────────────
-- Computed daily summaries (one row per employee per calendar day)
CREATE TABLE IF NOT EXISTS workforce_time_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id         UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  entry_date          DATE NOT NULL,
  clock_in_time       TIMESTAMPTZ,
  clock_out_time      TIMESTAMPTZ,
  break_minutes       NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_hours         NUMERIC(6,4) NOT NULL DEFAULT 0,
  regular_hours       NUMERIC(6,4) NOT NULL DEFAULT 0,
  overtime_hours      NUMERIC(6,4) NOT NULL DEFAULT 0,
  break_hours         NUMERIC(6,4) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'open',          -- open | pending | approved | disputed
  approved_at         TIMESTAMPTZ,
  disputed_at         TIMESTAMPTZ,
  dispute_reason      TEXT,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolution  TEXT,
  dispute_notes       TEXT,
  resolved_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_time_entries_emp_date
  ON workforce_time_entries(employee_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_tenant_status
  ON workforce_time_entries(tenant_id, status);

-- ── workforce_schedules ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  schedule_date   DATE NOT NULL,
  shift_start     TIME NOT NULL,
  shift_end       TIME NOT NULL,
  break_minutes   INT NOT NULL DEFAULT 0,
  department_id   UUID,
  position_id     UUID,
  notes           TEXT,
  published       BOOLEAN NOT NULL DEFAULT false,
  confirmed_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  template_id     UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_emp_date
  ON workforce_schedules(employee_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_tenant_date
  ON workforce_schedules(tenant_id, schedule_date);

-- ── workforce_schedule_templates ─────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_schedule_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  department_id UUID,
  name          TEXT NOT NULL,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── workforce_time_off_requests ──────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_time_off_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'pto',  -- pto | sick | unpaid | bereavement | other
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  hours_requested NUMERIC(6,2),
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | denied | cancelled
  reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  reviewer_notes  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_off_emp ON workforce_time_off_requests(employee_id, start_date);
CREATE INDEX IF NOT EXISTS idx_time_off_tenant_status ON workforce_time_off_requests(tenant_id, status);

-- ── workforce_pto_accruals ───────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_pto_accruals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  leave_type      TEXT NOT NULL DEFAULT 'pto',
  balance_hours   NUMERIC(8,2) NOT NULL DEFAULT 0,
  accrued_ytd     NUMERIC(8,2) NOT NULL DEFAULT 0,
  used_ytd        NUMERIC(8,2) NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, leave_type)
);

-- ── workforce_notifications ──────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  category    TEXT NOT NULL DEFAULT 'general',
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  action_url  TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_emp ON workforce_notifications(employee_id, created_at DESC);

-- ── workforce_briefings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_briefings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  briefing_category     TEXT NOT NULL DEFAULT 'general',
  content_type          TEXT NOT NULL DEFAULT 'text',   -- text | video | audio | quiz | checklist
  body                  TEXT,
  video_url             TEXT,
  playback_id           TEXT,
  video_duration_sec    INT,
  audio_url             TEXT,
  audio_duration_sec    INT,
  thumbnail_url         TEXT,
  min_watch_pct         INT NOT NULL DEFAULT 80,
  interaction_required  BOOLEAN NOT NULL DEFAULT false,
  interaction_type      TEXT,    -- quiz | checklist | response
  interaction_prompt    TEXT,
  interaction_config    JSONB,   -- { quiz_questions: [...], checklist_items: [...] }
  gates_clock_in        BOOLEAN NOT NULL DEFAULT false,
  gates_clock_out       BOOLEAN NOT NULL DEFAULT false,
  is_required           BOOLEAN NOT NULL DEFAULT false,
  status                TEXT NOT NULL DEFAULT 'draft',   -- draft | published | archived
  published_at          TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,
  created_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefings_tenant_status ON workforce_briefings(tenant_id, status);

-- ── workforce_briefing_completions ───────────────────────────
CREATE TABLE IF NOT EXISTS workforce_briefing_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  briefing_id     UUID NOT NULL REFERENCES workforce_briefings(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  watch_pct       INT NOT NULL DEFAULT 0,
  response        JSONB,
  passed          BOOLEAN,
  UNIQUE (briefing_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_briefing_completions_emp ON workforce_briefing_completions(employee_id);

-- ── workforce_personal_tasks ─────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_personal_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_to   UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  assigned_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  due_date      DATE,
  priority      TEXT NOT NULL DEFAULT 'normal',   -- low | normal | high
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | in_progress | done | cancelled
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_tasks_assigned ON workforce_personal_tasks(assigned_to, status);

-- ── workforce_payroll_runs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_payroll_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  pay_date     DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft',   -- draft | approved | paid | cancelled
  notes        TEXT,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant ON workforce_payroll_runs(tenant_id, pay_date DESC);

-- ── workforce_payroll_entries ────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_payroll_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           UUID NOT NULL REFERENCES workforce_payroll_runs(id) ON DELETE CASCADE,
  employee_id      UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  regular_hours    NUMERIC(8,4) NOT NULL DEFAULT 0,
  overtime_hours   NUMERIC(8,4) NOT NULL DEFAULT 0,
  hourly_rate      NUMERIC(10,4),
  gross_pay        NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions       JSONB NOT NULL DEFAULT '[]',
  taxes            JSONB NOT NULL DEFAULT '[]',
  net_pay          NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, employee_id)
);

-- ── workforce_recognition ────────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_recognition (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_employee_id    UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  to_employee_id      UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  title               TEXT NOT NULL DEFAULT 'Recognition',
  message             TEXT NOT NULL,
  value               TEXT,    -- reliability | safety | teamwork | quality | attitude
  is_public           BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recognition_to ON workforce_recognition(to_employee_id, created_at DESC);

-- ── workforce_cases ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_cases (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by_employee_id  UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  employee_id             UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  case_type               TEXT NOT NULL DEFAULT 'concern',      -- concern | coaching | disciplinary
  severity                TEXT NOT NULL DEFAULT 'low',          -- low | med | high
  category                TEXT,   -- attitude | quality | safety | communication | attendance
  title                   TEXT NOT NULL,
  description             TEXT NOT NULL,
  visible_to_employee     BOOLEAN NOT NULL DEFAULT false,
  status                  TEXT NOT NULL DEFAULT 'open',         -- open | resolved | closed
  resolved_at             TIMESTAMPTZ,
  resolved_by             UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes        TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cases_employee ON workforce_cases(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_status ON workforce_cases(tenant_id, status);

-- ── workforce_dependents ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_dependents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  relationship          TEXT NOT NULL,   -- spouse | domestic_partner | child | stepchild | foster_child | other
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  middle_name           TEXT,
  date_of_birth         DATE NOT NULL,
  gender                TEXT,
  ssn_last4             TEXT,
  is_disabled           BOOLEAN NOT NULL DEFAULT false,
  is_full_time_student  BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dependents_employee ON workforce_dependents(employee_id);

-- ── workforce_benefit_plans ──────────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_benefit_plans (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  benefit_type             TEXT NOT NULL,   -- medical | dental | vision | life | disability | 401k | other
  name                     TEXT NOT NULL,
  carrier                  TEXT,
  network_type             TEXT,            -- HMO | PPO | EPO | HDHP
  deductible_individual    NUMERIC(10,2),
  deductible_family        NUMERIC(10,2),
  out_of_pocket_individual NUMERIC(10,2),
  out_of_pocket_family     NUMERIC(10,2),
  summary_url              TEXT,
  tiers                    JSONB NOT NULL DEFAULT '[]',
  -- tiers: [{id, coverage_level, total_premium, company_contribution, employee_contribution, pay_period}]
  employee_cost_monthly    NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE
      WHEN jsonb_array_length(tiers) > 0
      THEN (tiers->0->>'employee_contribution')::NUMERIC
      ELSE NULL
    END
  ) STORED,
  employer_cost_monthly    NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE
      WHEN jsonb_array_length(tiers) > 0
      THEN (tiers->0->>'company_contribution')::NUMERIC
      ELSE NULL
    END
  ) STORED,
  is_active                BOOLEAN NOT NULL DEFAULT true,
  sort_order               INT NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_benefit_plans_tenant ON workforce_benefit_plans(tenant_id, benefit_type);

-- ── workforce_benefit_enrollments ────────────────────────────
CREATE TABLE IF NOT EXISTS workforce_benefit_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES workforce_benefit_plans(id) ON DELETE CASCADE,
  coverage_tier   TEXT NOT NULL DEFAULT 'employee_only',
  dependent_ids   JSONB NOT NULL DEFAULT '[]',
  effective_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT NOT NULL DEFAULT 'active',   -- active | waived | pending | terminated
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_benefit_enrollments_employee ON workforce_benefit_enrollments(employee_id);

-- ── workforce_devices ────────────────────────────────────────
-- Clock terminals and other registered devices
CREATE TABLE IF NOT EXISTS workforce_devices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uuid        TEXT NOT NULL,   -- fingerprint generated client-side
  label       TEXT NOT NULL,
  location    TEXT,
  role        TEXT NOT NULL DEFAULT 'clock_terminal',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  last_seen   TIMESTAMPTZ,
  registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, uuid)
);

-- ── tenant branding extras (extend existing tenants row) ─────
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS logo_url       TEXT,
  ADD COLUMN IF NOT EXISTS primary_color  TEXT,
  ADD COLUMN IF NOT EXISTS mission        TEXT,
  ADD COLUMN IF NOT EXISTS timezone       TEXT NOT NULL DEFAULT 'America/New_York';
