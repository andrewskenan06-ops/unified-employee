import { NextResponse } from 'next/server';
import { getEmployeeSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function POST(req) {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { employee_id, case_type, severity, category, title, description, visible_to_employee } = await req.json();
  if (!employee_id || !description) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  try {
    await sql`
      INSERT INTO workforce_cases
        (tenant_id, created_by_employee_id, employee_id, case_type, severity, category, title, description, visible_to_employee, status)
      VALUES
        (${session.tenantId}, ${session.employeeId}, ${employee_id}, ${case_type ?? 'concern'}, ${severity ?? 'low'}, ${category ?? null}, ${title ?? case_type}, ${description}, ${visible_to_employee ?? false}, 'open')
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
      SELECT * FROM workforce_cases
      WHERE employee_id = ${session.employeeId} AND visible_to_employee = true
      ORDER BY created_at DESC
      LIMIT 20
    `;
    return NextResponse.json({ cases: rows });
  } catch {
    return NextResponse.json({ cases: [] });
  }
}
