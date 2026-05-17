import sql from "@/lib/db";
import { randomUUID } from "crypto";

// POST /api/tenants — create a new tenant with seeded settings + admin user
export async function POST(request) {
  try {
    const { name, slug, adminName, adminPin } = await request.json();

    if (!name?.trim() || !slug?.trim() || !adminName?.trim() || !adminPin?.trim()) {
      return Response.json({ error: "All fields required" }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Check slug availability
    const existing = await sql`SELECT id FROM tenants WHERE slug = ${cleanSlug}`;
    if (existing.length) return Response.json({ error: "Slug already taken" }, { status: 409 });

    const tenantId = randomUUID();
    const adminId  = randomUUID();

    // Create tenant
    await sql`INSERT INTO tenants (id, name, slug) VALUES (${tenantId}, ${name.trim()}, ${cleanSlug})`;

    // Seed default settings for new tenant
    await sql`
      INSERT INTO app_settings (tenant_id, key, value, label, type) VALUES
        (${tenantId}, 'company_name',             ${name.trim()},   'Company Name',                 'text'),
        (${tenantId}, 'geofence_lat',             '33.7488',        'Geofence Latitude',             'number'),
        (${tenantId}, 'geofence_lng',             '-84.3234',       'Geofence Longitude',            'number'),
        (${tenantId}, 'geofence_radius_ft',       '1000',           'Geofence Radius (ft)',          'number'),
        (${tenantId}, 'overtime_threshold_hours', '60',             'Overtime Threshold (hrs/week)', 'number'),
        (${tenantId}, 'overtime_multiplier',      '1.5',            'Overtime Pay Multiplier',       'number'),
        (${tenantId}, 'income_tax_rate',          '0.21',           'Income Tax Rate (decimal)',     'number'),
        (${tenantId}, 'pay_period',               'weekly',         'Pay Period',                   'text'),
        (${tenantId}, 'pay_reference_date',       '2026-04-24',     'Reference Pay Date',           'text'),
        (${tenantId}, 'pin_length',               '4',              'PIN Length (digits)',           'number'),
        (${tenantId}, 'kiosk_reset_seconds',      '3',              'Kiosk Auto-Reset (seconds)',   'number'),
        (${tenantId}, 'employment_types',         '["full-time","part-time","contract"]', 'Employment Types', 'json'),
        (${tenantId}, 'health_plans',             '[{"value":"none","label":"No Coverage"},{"value":"basic","label":"Basic Plan"},{"value":"premium","label":"Premium Plan"}]', 'Health Plans', 'json'),
        (${tenantId}, 'work_day_hours',           '{"1":"6:30–4:30","2":"6:30–4:30","3":"6:30–4:30","4":"6:30–4:30","5":"6:30–4:30","6":"8–11 AM"}', 'Work Day Hours', 'json'),
        (${tenantId}, 'saturday_shift_label',     'Saturday Shift', 'Saturday Shift Label',         'text'),
        (${tenantId}, 'saturday_shift_hours',     '8:00 AM – 11:00 AM', 'Saturday Shift Hours','text')
    `;

    // Seed default job roles for new tenant
    await sql`
      INSERT INTO job_roles (tenant_id, name, color) VALUES
        (${tenantId}, 'Yard Worker',   'emerald'),
        (${tenantId}, 'Office Worker', 'blue'),
        (${tenantId}, 'Truck Driver',  'orange'),
        (${tenantId}, 'Dirt Manager',  'amber')
    `;

    // Create admin user
    await sql`
      INSERT INTO users (id, tenant_id, name, username, password, role, pin)
      VALUES (${adminId}, ${tenantId}, ${adminName.trim()}, ${cleanSlug + '_admin'}, 'n/a', 'admin', ${adminPin.trim()})
    `;

    return Response.json({ tenantId, slug: cleanSlug });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
