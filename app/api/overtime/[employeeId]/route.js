import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(request, { params }) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { employeeId } = await params;
    const rows = await sql`
      SELECT * FROM employee_overtime
      WHERE employee_id = ${employeeId} AND tenant_id = ${tenantId}
      ORDER BY week_start DESC`;
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { employeeId } = await params;
    const { week_start, week_end, overtime_hours, overtime_rate, overtime_pay } = await request.json();
    await sql`
      INSERT INTO employee_overtime (tenant_id, employee_id, week_start, week_end, overtime_hours, overtime_rate, overtime_pay)
      VALUES (${tenantId}, ${employeeId}, ${week_start}, ${week_end}, ${overtime_hours}, ${overtime_rate}, ${overtime_pay})
      ON CONFLICT (employee_id, week_start) DO UPDATE SET
        week_end       = EXCLUDED.week_end,
        overtime_hours = EXCLUDED.overtime_hours,
        overtime_rate  = EXCLUDED.overtime_rate,
        overtime_pay   = EXCLUDED.overtime_pay`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
