import sql from "@/lib/db";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { clockOut } = await request.json();

    await sql`
      UPDATE time_records SET
        clock_out          = ${clockOut.time},
        clock_out_lat      = ${clockOut.lat},
        clock_out_lng      = ${clockOut.lng},
        clock_out_dist_ft  = ${clockOut.distanceFt},
        flagged            = flagged OR ${clockOut.flagged}
      WHERE id = ${id}`;

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
