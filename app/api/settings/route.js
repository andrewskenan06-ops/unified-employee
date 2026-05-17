import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const rows = await sql`SELECT key, value, type FROM app_settings WHERE tenant_id = ${tenantId} ORDER BY key`;
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.type === "json"    ? JSON.parse(r.value)
                      : r.type === "number"  ? Number(r.value)
                      : r.type === "boolean" ? r.value === "true"
                      : r.value;
    }
    return Response.json(settings);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const updates = await request.json();
    for (const [key, value] of Object.entries(updates)) {
      const stored = typeof value === "object" ? JSON.stringify(value) : String(value);
      await sql`UPDATE app_settings SET value = ${stored} WHERE key = ${key} AND tenant_id = ${tenantId}`;
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
