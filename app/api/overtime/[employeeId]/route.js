import sql from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { employeeId } = await params;
    const rows = await sql`
      SELECT * FROM employee_overtime
      WHERE employee_id = ${employeeId}
      ORDER BY week_start DESC`;
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { employeeId } = await params;
    const { week_start, week_end, overtime_hours, overtime_rate, overtime_pay } = await request.json();
    await sql`
      INSERT INTO employee_overtime (employee_id, week_start, week_end, overtime_hours, overtime_rate, overtime_pay)
      VALUES (${employeeId}, ${week_start}, ${week_end}, ${overtime_hours}, ${overtime_rate}, ${overtime_pay})
      ON CONFLICT (employee_id, week_start) DO UPDATE SET
        week_end       = EXCLUDED.week_end,
        overtime_hours = EXCLUDED.overtime_hours,
        overtime_rate  = EXCLUDED.overtime_rate,
        overtime_pay   = EXCLUDED.overtime_pay`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
