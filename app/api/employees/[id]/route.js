import sql from "@/lib/db";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { jobRole } = await request.json();

    await sql`UPDATE users SET job_role = ${jobRole ?? null} WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
