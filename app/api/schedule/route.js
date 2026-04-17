import sql from "@/lib/db";

export async function GET() {
  try {
    const slots = await sql`
      SELECT ss.id AS slot_id, ss.date, ss.employee_id, u.name
      FROM schedule_slots ss
      JOIN users u ON u.id = ss.employee_id
      ORDER BY ss.date, ss.created_at`;

    // Format as { "2026-04-19": [{ id, name, slotId }] }
    const schedule = {};
    for (const row of slots) {
      const key = row.date instanceof Date
        ? row.date.toISOString().slice(0, 10)
        : String(row.date).slice(0, 10);
      if (!schedule[key]) schedule[key] = [];
      schedule[key].push({ id: row.employee_id, name: row.name, slotId: row.slot_id });
    }

    return Response.json(schedule);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { date, employeeId, addedBy } = await request.json();

    const result = await sql`
      INSERT INTO schedule_slots (date, employee_id, added_by)
      VALUES (${date}, ${employeeId}, ${addedBy ?? null})
      ON CONFLICT (date, employee_id) DO NOTHING
      RETURNING id`;

    return Response.json({ slotId: result[0]?.id ?? null });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
