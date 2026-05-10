import sql from "@/lib/db";

export async function GET() {
  try {
    const now       = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [
      clockedIn,
      flaggedRows,
      totalRow,
      recentFlagged,
      overtimeRow,
    ] = await Promise.all([
      // Who is currently clocked in
      sql`
        SELECT u.id, u.name, u.job_role, tr.clock_in, tr.clock_in_lat, tr.clock_in_lng, tr.clock_in_dist_ft
        FROM time_records tr
        JOIN users u ON u.id = tr.employee_id
        WHERE tr.clock_out IS NULL
        ORDER BY tr.clock_in ASC`,

      // Flagged punches this week
      sql`
        SELECT COUNT(*)::int AS count
        FROM time_records
        WHERE flagged = true
          AND clock_in >= ${weekStart.toISOString()}`,

      // Total employees
      sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'employee'`,

      // most recent flagged punches
      sql`
        SELECT tr.id, u.name, u.job_role, tr.clock_in, tr.clock_out,
               tr.clock_in_dist_ft, tr.clock_out_dist_ft, tr.flagged, tr.approved
        FROM time_records tr
        JOIN users u ON u.id = tr.employee_id
        WHERE tr.flagged = true
        ORDER BY tr.clock_in DESC
        LIMIT 20`,

      // Total overtime hours this week across all employees
      sql`
        SELECT COALESCE(SUM(overtime_hours), 0)::numeric AS total
        FROM employee_overtime
        WHERE week_start >= ${weekStart.toISOString()}::date`,
    ]);

    return Response.json({
      clockedIn,
      flaggedThisWeek: flaggedRows[0]?.count ?? 0,
      totalEmployees:  totalRow[0]?.count ?? 0,
      recentFlagged,
      totalOvertimeHours: Number(overtimeRow[0]?.total ?? 0),
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
