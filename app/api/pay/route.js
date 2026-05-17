import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const rows = await sql`
      SELECT u.id, u.name, u.job_role,
        ep.pay_type, ep.pay_rate, ep.pay_period,
        eb.health_plan, eb.dental, eb.vision, eb.retirement_pct
      FROM users u
      LEFT JOIN employee_pay      ep ON ep.employee_id = u.id
      LEFT JOIN employee_benefits eb ON eb.employee_id = u.id
      WHERE u.role = 'employee' AND u.tenant_id = ${tenantId}
      ORDER BY u.name`;
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
