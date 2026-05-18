import { NextResponse } from 'next/server';
import { getEmployeeSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const rows = await sql`
      SELECT * FROM workforce_dependents
      WHERE employee_id = ${session.employeeId}
      ORDER BY created_at
    `;
    return NextResponse.json({ dependents: rows });
  } catch {
    return NextResponse.json({ dependents: [] });
  }
}

export async function POST(req) {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { action, id, relationship, first_name, last_name, middle_name, date_of_birth, gender, ssn_last4, is_disabled, is_full_time_student } = body;

  try {
    if (action === 'remove') {
      await sql`DELETE FROM workforce_dependents WHERE id = ${id} AND employee_id = ${session.employeeId}`;
      return NextResponse.json({ ok: true });
    }
    if (action === 'update') {
      await sql`
        UPDATE workforce_dependents SET
          relationship = ${relationship}, first_name = ${first_name}, last_name = ${last_name},
          middle_name = ${middle_name ?? null}, date_of_birth = ${date_of_birth},
          gender = ${gender ?? null}, ssn_last4 = ${ssn_last4 ?? null},
          is_disabled = ${is_disabled ?? false}, is_full_time_student = ${is_full_time_student ?? false},
          updated_at = now()
        WHERE id = ${id} AND employee_id = ${session.employeeId}
      `;
      return NextResponse.json({ ok: true });
    }
    // create
    await sql`
      INSERT INTO workforce_dependents
        (employee_id, relationship, first_name, last_name, middle_name, date_of_birth, gender, ssn_last4, is_disabled, is_full_time_student)
      VALUES
        (${session.employeeId}, ${relationship}, ${first_name}, ${last_name}, ${middle_name ?? null}, ${date_of_birth}, ${gender ?? null}, ${ssn_last4 ?? null}, ${is_disabled ?? false}, ${is_full_time_student ?? false})
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
