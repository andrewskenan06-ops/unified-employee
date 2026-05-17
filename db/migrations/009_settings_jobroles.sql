-- Global app settings (key-value) and job roles tables

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  label      TEXT,
  type       TEXT NOT NULL DEFAULT 'text'   -- text | number | boolean | json
);

CREATE TABLE IF NOT EXISTS job_roles (
  id         SERIAL      PRIMARY KEY,
  name       TEXT        NOT NULL UNIQUE,
  color      TEXT        NOT NULL DEFAULT 'gray',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed default settings ────────────────────────────────────
INSERT INTO app_settings (key, value, label, type) VALUES
  ('company_name',             'Unified Employee',  'Company Name',                    'text'),
  ('geofence_lat',             '33.7488',           'Geofence Latitude',                'number'),
  ('geofence_lng',             '-84.3234',          'Geofence Longitude',               'number'),
  ('geofence_radius_ft',       '1000',              'Geofence Radius (ft)',             'number'),
  ('overtime_threshold_hours', '60',                'Overtime Threshold (hrs/week)',    'number'),
  ('overtime_multiplier',      '1.5',               'Overtime Pay Multiplier',          'number'),
  ('income_tax_rate',          '0.21',              'Income Tax Rate (decimal)',        'number'),
  ('pay_period',               'weekly',            'Pay Period',                       'text'),
  ('pay_reference_date',       '2026-04-24',        'Reference Pay Date',              'text'),
  ('pin_length',               '4',                 'PIN Length (digits)',              'number'),
  ('kiosk_reset_seconds',      '3',                 'Kiosk Auto-Reset (seconds)',       'number'),
  ('employment_types',         '["full-time","part-time","contract"]', 'Employment Types', 'json'),
  ('health_plans',             '[{"value":"none","label":"No Coverage"},{"value":"basic","label":"Basic Plan"},{"value":"premium","label":"Premium Plan"}]', 'Health Plans', 'json'),
  ('work_day_hours',           '{"1":"6:30–4:30","2":"6:30–4:30","3":"6:30–4:30","4":"6:30–4:30","5":"6:30–4:30","6":"8–11 AM"}', 'Work Day Hours', 'json'),
  ('saturday_shift_label',     'Saturday Shift',    'Saturday Shift Label',            'text'),
  ('saturday_shift_hours',     '8:00 AM – 11:00 AM','Saturday Shift Hours',            'text')
ON CONFLICT (key) DO NOTHING;

-- ── Seed default job roles ───────────────────────────────────
INSERT INTO job_roles (name, color) VALUES
  ('Yard Worker',   'emerald'),
  ('Office Worker', 'blue'),
  ('Truck Driver',  'orange'),
  ('Dirt Manager',  'amber')
ON CONFLICT (name) DO NOTHING;
