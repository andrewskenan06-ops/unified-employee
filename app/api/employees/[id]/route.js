import sql from "@/lib/db";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { name, job_role, pin, email, phone, start_date, employment_type, emergency_name, emergency_phone } = await request.json();
    await sql`
      UPDATE users SET
        name              = ${name},
        job_role          = ${job_role ?? null},
        pin               = ${pin},
        email             = ${email ?? null},
        phone             = ${phone ?? null},
        start_date        = ${start_date ?? null},
        employment_type   = ${employment_type ?? 'full-time'},
        emergency_name    = ${emergency_name ?? null},
        emergency_phone   = ${emergency_phone ?? null}
      WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM users WHERE id = ${id} AND role = 'employee'`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
