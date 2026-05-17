import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const slots = await sql`
      SELECT ss.id AS slot_id, ss.date, ss.employee_id, u.name, u.job_role
      FROM schedule_slots ss
      JOIN users u ON u.id = ss.employee_id
      WHERE ss.tenant_id = ${tenantId}
      ORDER BY ss.date, ss.created_at`;

    const schedule = {};
    for (const row of slots) {
      const key = row.date instanceof Date
        ? row.date.toISOString().slice(0, 10)
        : String(row.date).slice(0, 10);
      if (!schedule[key]) schedule[key] = [];
      schedule[key].push({ id: row.employee_id, name: row.name, slotId: row.slot_id, job_role: row.job_role });
    }

    return Response.json(schedule);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { date, employeeId, addedBy } = await request.json();

    const result = await sql`
      INSERT INTO schedule_slots (tenant_id, date, employee_id, added_by)
      VALUES (${tenantId}, ${date}, ${employeeId}, ${addedBy ?? null})
      ON CONFLICT (tenant_id, date, employee_id) DO NOTHING
      RETURNING id`;

    return Response.json({ slotId: result[0]?.id ?? null });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
