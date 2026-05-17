import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const roles = await sql`SELECT id, name, color FROM job_roles WHERE tenant_id = ${tenantId} ORDER BY name`;
    return Response.json(roles);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { name, color = "gray" } = await request.json();
    if (!name?.trim()) return Response.json({ error: "Name required" }, { status: 400 });

    const rows = await sql`
      INSERT INTO job_roles (tenant_id, name, color) VALUES (${tenantId}, ${name.trim()}, ${color})
      RETURNING id, name, color`;
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
