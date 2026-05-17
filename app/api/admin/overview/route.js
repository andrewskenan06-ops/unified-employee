import sql from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: "Tenant required" }, { status: 400 });

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
      sql`
        SELECT u.id, u.name, u.job_role, tr.clock_in, tr.clock_in_lat, tr.clock_in_lng, tr.clock_in_dist_ft
        FROM time_records tr
        JOIN users u ON u.id = tr.employee_id
        WHERE tr.clock_out IS NULL AND tr.tenant_id = ${tenantId}
        ORDER BY tr.clock_in ASC`,

      sql`
        SELECT COUNT(*)::int AS count
        FROM time_records
        WHERE flagged = true AND tenant_id = ${tenantId}
          AND clock_in >= ${weekStart.toISOString()}`,

      sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'employee' AND tenant_id = ${tenantId}`,

      sql`
        SELECT tr.id, u.name, u.job_role, tr.clock_in, tr.clock_out,
               tr.clock_in_dist_ft, tr.clock_out_dist_ft, tr.flagged, tr.approved
        FROM time_records tr
        JOIN users u ON u.id = tr.employee_id
        WHERE tr.flagged = true AND tr.tenant_id = ${tenantId}
        ORDER BY tr.clock_in DESC
        LIMIT 20`,

      sql`
        SELECT COALESCE(SUM(eo.overtime_hours), 0)::numeric AS total
        FROM employee_overtime eo
        WHERE eo.tenant_id = ${tenantId}
          AND eo.week_start >= ${weekStart.toISOString()}::date`,
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
