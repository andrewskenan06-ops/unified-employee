import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function PATCH(request, { params }) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { key } = await params;
    const { value, change_pct, change_label } = await request.json();
    const rows = await sql`
      UPDATE report_metrics
      SET value        = ${value        ?? null},
          change_pct   = ${change_pct   ?? null},
          change_label = ${change_label ?? null},
          updated_at   = NOW()
      WHERE metric_key = ${key} AND tenant_id = ${tenantId}
      RETURNING *`;
    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
