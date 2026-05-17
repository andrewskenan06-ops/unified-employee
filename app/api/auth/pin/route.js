import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function POST(request) {
  try {
    let tenantId = getTenantId(request);
    if (!tenantId) {
      // Fall back to the demo tenant for single-tenant / unbranded kiosk access
      const demo = await sql`SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1`;
      if (demo.length === 0) return Response.json({ error: "Tenant required" }, { status: 400 });
      tenantId = demo[0].id;
    }

    const { pin } = await request.json();
    if (!pin) return Response.json({ error: "PIN required" }, { status: 400 });

    const users = await sql`
      SELECT id, name, role, username, job_role AS "jobRole", status,
             require_geofence AS "requireGeofence",
             allow_mobile_anywhere AS "allowMobileAnywhere"
      FROM users WHERE pin = ${pin} AND tenant_id = ${tenantId}
    `;
    if (users.length === 0) return Response.json({ error: "Invalid PIN" }, { status: 401 });

    const user = users[0];
    if (user.status === "inactive") return Response.json({ error: "Account inactive" }, { status: 403 });

    const active = await sql`
      SELECT id FROM time_records
      WHERE employee_id = ${user.id} AND tenant_id = ${tenantId} AND clock_out IS NULL
      ORDER BY clock_in DESC LIMIT 1
    `;

    return Response.json({ user, activeRecordId: active[0]?.id ?? null });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
