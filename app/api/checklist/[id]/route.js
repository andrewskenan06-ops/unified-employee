import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function PATCH(request, { params }) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { id } = await params;
    const { message, type, button_text, sort_order, video_url } = await request.json();
    const rows = await sql`
      UPDATE checklist_questions SET
        message     = ${message},
        type        = ${type},
        button_text = ${button_text},
        sort_order  = ${sort_order},
        video_url   = ${video_url ?? null}
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *`;
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const tenantId = getTenantId(_request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

    const { id } = await params;
    await sql`DELETE FROM checklist_questions WHERE id = ${id} AND tenant_id = ${tenantId}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
