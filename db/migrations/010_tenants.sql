-- Multi-tenancy: tenants table + tenant_id on every data table

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Seed the default/demo tenant with a fixed UUID so backfill is idempotent
INSERT INTO tenants (id, name, slug) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Company', 'demo')
ON CONFLICT (id) DO NOTHING;

-- 3. Add tenant_id columns (nullable first so backfill can run)
ALTER TABLE users               ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE time_records        ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE schedule_slots      ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE employee_pay        ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE employee_benefits   ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE employee_deductions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE employee_hours      ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE pay_stubs           ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE employee_overtime   ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tasks               ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE financial_entries   ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE report_metrics      ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE checklist_questions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE app_settings        ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE job_roles           ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 4. Backfill all existing rows with demo tenant
UPDATE users               SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE time_records        SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE schedule_slots      SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE employee_pay        SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE employee_benefits   SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE employee_deductions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE employee_hours      SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE pay_stubs           SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE employee_overtime   SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE tasks               SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE financial_entries   SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE report_metrics      SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE checklist_questions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE app_settings        SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE job_roles           SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- 5. Enforce NOT NULL now that all rows are backfilled
ALTER TABLE users               ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE time_records        ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE schedule_slots      ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE employee_pay        ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE employee_benefits   ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE employee_deductions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE employee_hours      ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE pay_stubs           ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE employee_overtime   ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tasks               ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE financial_entries   ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE report_metrics      ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE checklist_questions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE app_settings        ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE job_roles           ALTER COLUMN tenant_id SET NOT NULL;

-- 6. Fix unique constraints to be tenant-scoped

-- app_settings: drop single-column PK, replace with composite
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_pkey;
ALTER TABLE app_settings ADD PRIMARY KEY (tenant_id, key);

-- job_roles: drop name-only unique, replace with (tenant_id, name)
ALTER TABLE job_roles DROP CONSTRAINT IF EXISTS job_roles_name_key;
ALTER TABLE job_roles ADD CONSTRAINT job_roles_tenant_name_key UNIQUE (tenant_id, name);

-- users: drop username-only unique, replace with (tenant_id, username)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users ADD CONSTRAINT users_tenant_username_key UNIQUE (tenant_id, username);

-- schedule_slots: drop (date, employee_id), replace with (tenant_id, date, employee_id)
ALTER TABLE schedule_slots DROP CONSTRAINT IF EXISTS schedule_slots_date_employee_id_key;
ALTER TABLE schedule_slots ADD CONSTRAINT schedule_slots_tenant_date_employee_key UNIQUE (tenant_id, date, employee_id);

-- 7. Drop hardcoded job_role CHECK constraint on users (roles are now per-tenant)
DO $$ BEGIN
  ALTER TABLE users DROP CONSTRAINT users_job_role_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 8. Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant               ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_time_records_tenant        ON time_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_tenant      ON schedule_slots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_pay_tenant        ON employee_pay(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_benefits_tenant   ON employee_benefits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_deductions_tenant ON employee_deductions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_hours_tenant      ON employee_hours(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_stubs_tenant           ON pay_stubs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_overtime_tenant   ON employee_overtime(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant               ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_tenant   ON financial_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_metrics_tenant      ON report_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checklist_questions_tenant ON checklist_questions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_roles_tenant           ON job_roles(tenant_id);
