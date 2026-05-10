import sql from "@/lib/db";

export async function GET() {
  try {
    const employees = await sql`
      SELECT u.id, u.name, u.job_role, u.pin, u.status,
             u.email, u.phone, u.start_date, u.employment_type,
             u.emergency_name, u.emergency_phone,
             ep.pay_type, ep.pay_rate, ep.pay_period,
             eb.health_plan, eb.dental, eb.vision, eb.retirement_pct,
             ed.child_support, ed.child_support_amount
      FROM users u
      LEFT JOIN employee_pay         ep ON ep.employee_id = u.id
      LEFT JOIN employee_benefits    eb ON eb.employee_id = u.id
      LEFT JOIN employee_deductions  ed ON ed.employee_id = u.id
      WHERE u.role = 'employee'
      ORDER BY u.name`;
    return Response.json(employees);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const {
      id, name, job_role, pin, email, phone, start_date, employment_type,
      emergency_name, emergency_phone,
      pay_type, pay_rate,
      health_plan, dental, vision, retirement_pct,
      child_support, child_support_amount,
    } = await request.json();

    await sql`
      INSERT INTO users (id, name, job_role, pin, role, email, phone, start_date, employment_type, emergency_name, emergency_phone)
      VALUES (${id}, ${name}, ${job_role}, ${pin}, 'employee',
              ${email ?? null}, ${phone ?? null}, ${start_date ?? null},
              ${employment_type ?? 'full-time'}, ${emergency_name ?? null}, ${emergency_phone ?? null})`;

    if (pay_rate) {
      await sql`
        INSERT INTO employee_pay (employee_id, pay_type, pay_rate, pay_period)
        VALUES (${id}, ${pay_type ?? 'hourly'}, ${parseFloat(pay_rate)}, 'weekly')
        ON CONFLICT DO NOTHING`;
    }

    await sql`
      INSERT INTO employee_benefits (employee_id, health_plan, dental, vision, retirement_pct)
      VALUES (${id}, ${health_plan ?? 'none'}, ${dental ?? false}, ${vision ?? false}, ${parseFloat(retirement_pct) || 0})
      ON CONFLICT DO NOTHING`;

    await sql`
      INSERT INTO employee_deductions (employee_id, child_support, child_support_amount)
      VALUES (${id}, ${child_support ?? false}, ${parseFloat(child_support_amount) || 0})
      ON CONFLICT DO NOTHING`;

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
