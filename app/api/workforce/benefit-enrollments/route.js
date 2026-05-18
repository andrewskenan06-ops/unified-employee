import { NextResponse } from 'next/server';
import { getEmployeeSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const enrollments = await sql`
      SELECT e.*, p.name AS plan_name, p.benefit_type, p.employee_cost_monthly, p.employer_cost_monthly
      FROM workforce_benefit_enrollments e
      JOIN workforce_benefit_plans p ON p.id = e.plan_id
      WHERE e.employee_id = ${session.employeeId}
      ORDER BY p.benefit_type
    `;
    return NextResponse.json({ enrollments });
  } catch {
    return NextResponse.json({ enrollments: [] });
  }
}

export async function POST(req) {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { plan_id, coverage_tier, dependent_ids, effective_date, action, enrollment_id } = body;

  try {
    if (action === 'waive' && enrollment_id) {
      await sql`
        UPDATE workforce_benefit_enrollments
        SET status = 'waived', updated_at = now()
        WHERE id = ${enrollment_id} AND employee_id = ${session.employeeId}
      `;
      return NextResponse.json({ ok: true });
    }
    await sql`
      INSERT INTO workforce_benefit_enrollments
        (employee_id, plan_id, coverage_tier, dependent_ids, effective_date, status)
      VALUES
        (${session.employeeId}, ${plan_id}, ${coverage_tier ?? 'employee_only'}, ${JSON.stringify(dependent_ids ?? [])}, ${effective_date ?? new Date().toISOString().slice(0,10)}, 'active')
      ON CONFLICT (employee_id, plan_id)
      DO UPDATE SET coverage_tier = EXCLUDED.coverage_tier, dependent_ids = EXCLUDED.dependent_ids, status = 'active', updated_at = now()
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
