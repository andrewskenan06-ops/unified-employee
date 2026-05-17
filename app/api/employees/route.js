import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const employees = await sql`
      SELECT u.id, u.name, u.job_role, u.pin, u.status,
             u.email, u.phone, u.start_date, u.employment_type,
             u.emergency_name, u.emergency_phone,
             u.require_geofence, u.allow_mobile_anywhere,
             ep.pay_type, ep.pay_rate, ep.pay_period,
             eb.health_plan, eb.dental, eb.vision, eb.retirement_pct,
             ed.child_support, ed.child_support_amount
      FROM users u
      LEFT JOIN employee_pay         ep ON ep.employee_id = u.id
      LEFT JOIN employee_benefits    eb ON eb.employee_id = u.id
      LEFT JOIN employee_deductions  ed ON ed.employee_id = u.id
      WHERE u.role = 'employee' AND u.tenant_id = ${tenantId}
      ORDER BY u.name`;
    return Response.json(employees);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const {
      id, name, job_role, pin, email, phone, start_date, employment_type,
      emergency_name, emergency_phone,
      pay_type, pay_rate,
      health_plan, dental, vision, retirement_pct,
      child_support, child_support_amount,
      require_geofence = true, allow_mobile_anywhere = false,
    } = await request.json();

    await sql`
      INSERT INTO users (id, tenant_id, name, job_role, pin, role, email, phone, start_date, employment_type, emergency_name, emergency_phone, require_geofence, allow_mobile_anywhere)
      VALUES (${id}, ${tenantId}, ${name}, ${job_role}, ${pin}, 'employee',
              ${email ?? null}, ${phone ?? null}, ${start_date ?? null},
              ${employment_type ?? 'full-time'}, ${emergency_name ?? null}, ${emergency_phone ?? null},
              ${require_geofence}, ${allow_mobile_anywhere})`;

    if (pay_rate) {
      await sql`
        INSERT INTO employee_pay (tenant_id, employee_id, pay_type, pay_rate, pay_period)
        VALUES (${tenantId}, ${id}, ${pay_type ?? 'hourly'}, ${parseFloat(pay_rate)}, 'weekly')
        ON CONFLICT (employee_id) DO NOTHING`;
    }

    await sql`
      INSERT INTO employee_benefits (tenant_id, employee_id, health_plan, dental, vision, retirement_pct)
      VALUES (${tenantId}, ${id}, ${health_plan ?? 'none'}, ${dental ?? false}, ${vision ?? false}, ${parseFloat(retirement_pct) || 0})
      ON CONFLICT (employee_id) DO NOTHING`;

    await sql`
      INSERT INTO employee_deductions (tenant_id, employee_id, child_support, child_support_amount)
      VALUES (${tenantId}, ${id}, ${child_support ?? false}, ${parseFloat(child_support_amount) || 0})
      ON CONFLICT (employee_id) DO NOTHING`;

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
