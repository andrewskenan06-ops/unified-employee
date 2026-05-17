import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const rows = month
      ? await sql`SELECT * FROM financial_entries WHERE tenant_id = ${tenantId} AND month = ${month} ORDER BY section, id`
      : await sql`SELECT * FROM financial_entries WHERE tenant_id = ${tenantId} ORDER BY section, id`;
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { section, label, amount, month, notes } = await request.json();
    const rows = await sql`
      INSERT INTO financial_entries (tenant_id, section, label, amount, month, notes)
      VALUES (${tenantId}, ${section}, ${label}, ${amount}, ${month}, ${notes ?? null})
      RETURNING *`;
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
