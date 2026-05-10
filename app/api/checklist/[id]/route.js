import sql from "@/lib/db";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { message, type, button_text, sort_order, video_url } = await request.json();
    const rows = await sql`
      UPDATE checklist_questions SET
        message     = ${message},
        type        = ${type},
        button_text = ${button_text},
        sort_order  = ${sort_order},
        video_url   = ${video_url ?? null}
      WHERE id = ${id}
      RETURNING *`;
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM checklist_questions WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
