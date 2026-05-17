import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get("assignedTo");

    const rows = assignedTo
      ? await sql`
          SELECT t.*, u.name AS assigned_name FROM tasks t
          JOIN users u ON u.id = t.assigned_to
          WHERE t.tenant_id = ${tenantId} AND t.assigned_to = ${assignedTo}
          ORDER BY t.created_at DESC`
      : await sql`
          SELECT t.*, u.name AS assigned_name FROM tasks t
          LEFT JOIN users u ON u.id = t.assigned_to
          WHERE t.tenant_id = ${tenantId}
          ORDER BY t.created_at DESC`;

    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { title, description, assigned_to, created_by, due_date, priority } = await request.json();
    const rows = await sql`
      INSERT INTO tasks (tenant_id, title, description, assigned_to, created_by, due_date, priority)
      VALUES (${tenantId}, ${title}, ${description ?? null}, ${assigned_to}, ${created_by}, ${due_date ?? null}, ${priority ?? "medium"})
      RETURNING *`;
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
