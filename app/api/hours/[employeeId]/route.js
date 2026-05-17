import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(request, { params }) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { employeeId } = await params;
    const rows = await sql`
      SELECT * FROM employee_hours
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
    const { week_start, week_end, hours_worked, regular_hours } = await request.json();
    await sql`
      INSERT INTO employee_hours (tenant_id, employee_id, week_start, week_end, hours_worked, regular_hours)
      VALUES (${tenantId}, ${employeeId}, ${week_start}, ${week_end}, ${hours_worked}, ${regular_hours})
      ON CONFLICT (employee_id, week_start) DO UPDATE SET
        week_end      = EXCLUDED.week_end,
        hours_worked  = EXCLUDED.hours_worked,
        regular_hours = EXCLUDED.regular_hours`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
