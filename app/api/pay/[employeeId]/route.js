import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(request, { params }) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { employeeId } = await params;

    const [payRows, benefitRows, stubRows] = await Promise.all([
      sql`SELECT * FROM employee_pay WHERE employee_id = ${employeeId} AND tenant_id = ${tenantId}`,
      sql`SELECT * FROM employee_benefits WHERE employee_id = ${employeeId} AND tenant_id = ${tenantId}`,
      sql`SELECT * FROM pay_stubs WHERE employee_id = ${employeeId} AND tenant_id = ${tenantId} ORDER BY period_end DESC`,
    ]);

    return Response.json({
      pay:      payRows[0]    ?? null,
      benefits: benefitRows[0] ?? null,
      stubs:    stubRows,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { employeeId } = await params;
    const body = await request.json();

    if (body.pay) {
      const { pay_type, pay_rate, pay_period } = body.pay;
      await sql`
        INSERT INTO employee_pay (tenant_id, employee_id, pay_type, pay_rate, pay_period)
        VALUES (${tenantId}, ${employeeId}, ${pay_type}, ${pay_rate}, ${pay_period})
        ON CONFLICT (employee_id) DO UPDATE SET
          pay_type   = EXCLUDED.pay_type,
          pay_rate   = EXCLUDED.pay_rate,
          pay_period = EXCLUDED.pay_period,
          updated_at = NOW()`;
    }

    if (body.benefits) {
      const { health_plan, dental, vision, retirement_pct } = body.benefits;
      await sql`
        INSERT INTO employee_benefits (tenant_id, employee_id, health_plan, dental, vision, retirement_pct)
        VALUES (${tenantId}, ${employeeId}, ${health_plan}, ${dental}, ${vision}, ${retirement_pct})
        ON CONFLICT (employee_id) DO UPDATE SET
          health_plan    = EXCLUDED.health_plan,
          dental         = EXCLUDED.dental,
          vision         = EXCLUDED.vision,
          retirement_pct = EXCLUDED.retirement_pct,
          updated_at     = NOW()`;
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
