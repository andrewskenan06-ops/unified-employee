import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function PATCH(request, { params }) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { id } = await params;
    const { name, color } = await request.json();
    await sql`UPDATE job_roles SET name = ${name}, color = ${color} WHERE id = ${id} AND tenant_id = ${tenantId}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const tenantId = getTenantId(_request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { id } = await params;
    await sql`DELETE FROM job_roles WHERE id = ${id} AND tenant_id = ${tenantId}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
