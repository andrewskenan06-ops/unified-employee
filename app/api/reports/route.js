import sql from "@/lib/db";

// GET /api/reports?category=financials  → all metrics for a category
// GET /api/reports                      → all metrics grouped by category
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const rows = category
      ? await sql`SELECT * FROM report_metrics WHERE category = ${category} ORDER BY id`
      : await sql`SELECT * FROM report_metrics ORDER BY category, id`;

    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/reports  { key, value, change_pct, change_label }  → upsert a metric value
export async function POST(request) {
  try {
    const { key, value, change_pct, change_label } = await request.json();
    const rows = await sql`
      UPDATE report_metrics
      SET value        = ${value ?? null},
          change_pct   = ${change_pct   ?? null},
          change_label = ${change_label ?? null},
          updated_at   = NOW()
      WHERE metric_key = ${key}
      RETURNING *`;
    if (!rows.length) return Response.json({ error: "Metric key not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
