import sql from "@/lib/db";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM schedule_slots WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
