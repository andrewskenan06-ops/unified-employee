import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function PATCH(request, { params }) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { id } = await params;
    const body = await request.json();

    if (body.status) {
      const completedAt = body.status === "completed" ? new Date().toISOString() : null;
      await sql`UPDATE tasks SET status = ${body.status}, completed_at = ${completedAt} WHERE id = ${id} AND tenant_id = ${tenantId}`;
      return Response.json({ ok: true });
    }

    const { title, description, due_date, priority } = body;
    await sql`
      UPDATE tasks SET
        title       = ${title},
        description = ${description ?? null},
        due_date    = ${due_date ?? null},
        priority    = ${priority ?? "medium"}
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
    await sql`DELETE FROM tasks WHERE id = ${id} AND tenant_id = ${tenantId}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
