import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function PATCH(request, { params }) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { id } = await params;
    const { name, job_role, pin, email, phone, start_date, employment_type, emergency_name, emergency_phone, require_geofence, allow_mobile_anywhere } = await request.json();
    await sql`
      UPDATE users SET
        name                  = ${name},
        job_role              = ${job_role ?? null},
        pin                   = ${pin},
        email                 = ${email ?? null},
        phone                 = ${phone ?? null},
        start_date            = ${start_date ?? null},
        employment_type       = ${employment_type ?? 'full-time'},
        emergency_name        = ${emergency_name ?? null},
        emergency_phone       = ${emergency_phone ?? null},
        require_geofence      = ${require_geofence ?? true},
        allow_mobile_anywhere = ${allow_mobile_anywhere ?? false}
      WHERE id = ${id} AND tenant_id = ${tenantId}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { id } = await params;
    await sql`DELETE FROM users WHERE id = ${id} AND role = 'employee' AND tenant_id = ${tenantId}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
