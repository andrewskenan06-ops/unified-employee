import sql from "@/lib/db";

function fmt(r) {
  return {
    id:           r.id,
    employeeId:   r.employee_id,
    employeeName: r.employee_name,
    date:         r.clock_in,
    clockIn: {
      time:       r.clock_in,
      lat:        r.clock_in_lat,
      lng:        r.clock_in_lng,
      distanceFt: r.clock_in_dist_ft,
      flagged:    r.flagged,
    },
    clockOut: r.clock_out ? {
      time:       r.clock_out,
      lat:        r.clock_out_lat,
      lng:        r.clock_out_lng,
      distanceFt: r.clock_out_dist_ft,
      flagged:    r.flagged,
    } : null,
    status:  r.clock_out ? "complete" : "active",
    flagged: r.flagged,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    const records = employeeId
      ? await sql`
          SELECT tr.*, u.name AS employee_name FROM time_records tr
          JOIN users u ON u.id = tr.employee_id
          WHERE tr.employee_id = ${employeeId}
          ORDER BY tr.clock_in DESC`
      : await sql`
          SELECT tr.*, u.name AS employee_name FROM time_records tr
          JOIN users u ON u.id = tr.employee_id
          ORDER BY tr.clock_in DESC`;

    return Response.json(records.map(fmt));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { employeeId, clockIn } = await request.json();

    const result = await sql`
      INSERT INTO time_records
        (employee_id, clock_in, clock_in_lat, clock_in_lng, clock_in_dist_ft, flagged)
      VALUES
        (${employeeId}, ${clockIn.time}, ${clockIn.lat}, ${clockIn.lng}, ${clockIn.distanceFt}, ${clockIn.flagged})
      RETURNING id`;

    return Response.json({ id: result[0].id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
