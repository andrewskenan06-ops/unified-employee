import { NextResponse } from 'next/server';
import { getEmployeeSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function POST(req) {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { to_employee_id, title, message, value, is_public } = await req.json();
  if (!to_employee_id || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  try {
    await sql`
      INSERT INTO workforce_recognition
        (tenant_id, from_employee_id, to_employee_id, title, message, value, is_public)
      VALUES
        (${session.tenantId}, ${session.employeeId}, ${to_employee_id}, ${title ?? 'Recognition'}, ${message}, ${value ?? null}, ${is_public ?? false})
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const rows = await sql`
      SELECT r.*,
        from_e.first_name || ' ' || from_e.last_name AS from_name
      FROM workforce_recognition r
      JOIN workforce_employees from_e ON from_e.id = r.from_employee_id
      WHERE r.to_employee_id = ${session.employeeId}
      ORDER BY r.created_at DESC
      LIMIT 20
    `;
    return NextResponse.json({ recognition: rows });
  } catch {
    return NextResponse.json({ recognition: [] });
  }
}
