import sql from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { employeeId } = await params;
    const rows = await sql`SELECT * FROM employee_deductions WHERE employee_id = ${employeeId}`;
    return Response.json(rows[0] ?? null);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { employeeId } = await params;
    const body = await request.json();
    await sql`
      INSERT INTO employee_deductions (employee_id, federal_tax, state_tax, social_security, medicare, benefits, child_support, child_support_amount)
      VALUES (${employeeId}, ${body.federal_tax}, ${body.state_tax}, ${body.social_security}, ${body.medicare}, ${body.benefits}, ${body.child_support}, ${body.child_support_amount})
      ON CONFLICT (employee_id) DO UPDATE SET
        federal_tax          = EXCLUDED.federal_tax,
        state_tax            = EXCLUDED.state_tax,
        social_security      = EXCLUDED.social_security,
        medicare             = EXCLUDED.medicare,
        benefits             = EXCLUDED.benefits,
        child_support        = EXCLUDED.child_support,
        child_support_amount = EXCLUDED.child_support_amount,
        updated_at           = NOW()`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
