import { NextResponse } from 'next/server';
import { getSession, getEmployeeSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { getEmployeeByUserId, listEmployees } from '@/lib/workforce/employees';
import { createPayrollRun, createCheckPayroll, getCheckPayrollStatus, syncEmployeeToCheck } from '@/lib/workforce/payroll';
import { getEstimatedPayStubs } from '@/lib/workforce/pay-stub-estimator';
import { sql } from '@/lib/db';

async function getEitherSession() {
  return (await getEmployeeSession()) ?? (await getSession());
}

export async function GET(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  if (view === 'runs') {
    const runs = await sql`
      SELECT * FROM workforce_payroll_runs
      WHERE tenant_id = ${ctx.tenant.id}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ runs });
  }

  if (view === 'run_detail') {
    const runId = searchParams.get('run_id');
    if (!runId) return NextResponse.json({ error: 'run_id required' }, { status: 400 });
    const [runs, entries] = await Promise.all([
      sql`SELECT * FROM workforce_payroll_runs WHERE id = ${runId} AND tenant_id = ${ctx.tenant.id} LIMIT 1`,
      sql`SELECT * FROM workforce_payroll_entries WHERE run_id = ${runId} ORDER BY employee_id`,
    ]);
    return NextResponse.json({ run: runs[0] ?? null, entries });
  }

  if (view === 'estimated_stubs') {
    const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
    if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
    const stubs = await getEstimatedPayStubs(ctx.tenant.id, employee);
    return NextResponse.json({ stubs });
  }

  const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
  if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
  const stubs = await assemblePaycheckStubs(ctx.tenant.id, employee.id);
  return NextResponse.json({ stubs });
}

export async function POST(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const { action } = body;

  if (action === 'create_run') {
    const { period_start, period_end, pay_date } = body;
    if (!period_start || !period_end || !pay_date) {
      return NextResponse.json({ error: 'period_start, period_end, pay_date required' }, { status: 400 });
    }
    const run = await createPayrollRun(ctx.tenant.id, period_start, period_end, pay_date, ctx.userId);
    return NextResponse.json({ ok: true, run });
  }

  if (action === 'submit_check') {
    const { run_id } = body;
    const result = await createCheckPayroll(ctx.tenant.id, run_id);
    return NextResponse.json(result);
  }

  if (action === 'check_status') {
    const { run_id } = body;
    const result = await getCheckPayrollStatus(ctx.tenant.id, run_id);
    return NextResponse.json(result);
  }

  if (action === 'sync_employee') {
    const { employee_id } = body;
    const result = await syncEmployeeToCheck(ctx.tenant.id, employee_id);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

async function assemblePaycheckStubs(tenantId, employeeId) {
  try {
    const rows = await sql`
      SELECT
        pe.*,
        pr.period_start, pr.period_end, pr.pay_date, pr.status AS run_status
      FROM workforce_payroll_entries pe
      JOIN workforce_payroll_runs pr ON pr.id = pe.run_id
      WHERE pe.employee_id = ${employeeId}
        AND pr.tenant_id = ${tenantId}
        AND pr.status IN ('approved', 'paid')
      ORDER BY pr.pay_date DESC
      LIMIT 24
    `;
    return rows.map(r => ({
      id: r.id,
      run_id: r.run_id,
      period_start: r.period_start,
      period_end: r.period_end,
      pay_date: r.pay_date,
      status: r.run_status,
      gross_pay: Number(r.gross_pay) || 0,
      net_pay: Number(r.net_pay) || 0,
      regular_hours: Number(r.regular_hours) || 0,
      overtime_hours: Number(r.overtime_hours) || 0,
      hourly_rate: Number(r.hourly_rate) || 0,
      deductions: r.deductions ?? [],
      taxes: r.taxes ?? [],
    }));
  } catch {
    return [];
  }
}
