import sql from "@/lib/db";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { label, amount, notes } = await request.json();
    await sql`UPDATE financial_entries SET label=${label}, amount=${amount}, notes=${notes ?? null} WHERE id=${id}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM financial_entries WHERE id=${id}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
