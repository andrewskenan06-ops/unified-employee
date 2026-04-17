import sql from "@/lib/db";

export async function POST(request) {
  try {
    const { pin } = await request.json();
    if (!pin) return Response.json({ error: "PIN required" }, { status: 400 });

    const users = await sql`
      SELECT id, name, role, username, job_role AS "jobRole"
      FROM users WHERE pin = ${pin}
    `;
    if (users.length === 0) return Response.json({ error: "Invalid PIN" }, { status: 401 });

    const user = users[0];

    const active = await sql`
      SELECT id FROM time_records
      WHERE employee_id = ${user.id} AND clock_out IS NULL
      ORDER BY clock_in DESC LIMIT 1
    `;

    return Response.json({ user, activeRecordId: active[0]?.id ?? null });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
