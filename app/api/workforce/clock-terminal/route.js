import { NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant';
import { verifyPin, getTenantTimezone, todayInTimezone } from '@/lib/workforce/pin-auth';
import { getEmployee, listEmployees } from '@/lib/workforce/employees';
import { clockIn, clockOut, startBreak, endBreak, getClockStatus } from '@/lib/workforce/clock';
import {
  hasCompletedGateBriefings, hasCompletedClockOutBriefings,
  getTodaysBriefings, getClockOutBriefings,
  startBriefing, completeBriefingInteraction,
} from '@/lib/workforce/briefings';
import { checkClockInApprovalGate, getPendingDailyApprovals, reportMissedPunch } from '@/lib/workforce/daily-approvals';
import { getBranding } from '@/lib/workforce/branding';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

async function resolveTenantId(req) {
  const headerTenantId = req.headers.get('x-tenant-id');
  if (headerTenantId) return headerTenantId;
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('tenant') ?? searchParams.get('slug');
  if (slug) {
    const rows = await sql`SELECT id FROM tenants WHERE slug = ${slug} LIMIT 1`;
    if (rows[0]) return rows[0].id;
  }
  const rows = await sql`SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1`;
  return rows[0]?.id ?? null;
}

export async function GET(req) {
  const tenantId = await resolveTenantId(req);
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  const branding = await getBranding(tenantId);

  if (view === 'roster') {
    const tz = await getTenantTimezone(tenantId);
    const today = todayInTimezone(tz);
    const employees = await listEmployees(tenantId);
    const statuses = await Promise.all(
      employees.map(async emp => {
        const status = await getClockStatus(tenantId, emp.id);
        return {
          id: emp.id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          preferred_name: emp.preferred_name,
          photo_url: emp.photo_url,
          department_id: emp.department_id,
          ...status,
        };
      })
    );
    return NextResponse.json({ employees: statuses, today, branding });
  }

  return NextResponse.json({ branding });
}

export async function POST(req) {
  const tenantId = await resolveTenantId(req);
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const body = await req.json();
  const { action, pin } = body;

  if (action === 'verify_pin') {
    if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    const result = await verifyPin(tenantId, pin);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 401 });

    const employee = result.employee;
    const tz = await getTenantTimezone(tenantId);
    const today = todayInTimezone(tz);

    const [clockStatus, briefingGate, clockOutGate, todaysBriefings, clockOutBriefings, approvalGate, pendingApprovals] = await Promise.all([
      getClockStatus(tenantId, employee.id),
      hasCompletedGateBriefings(tenantId, employee.id, today),
      hasCompletedClockOutBriefings(tenantId, employee.id, today),
      getTodaysBriefings(tenantId, employee.id, today),
      getClockOutBriefings(tenantId, employee.id, today),
      checkClockInApprovalGate(tenantId, employee.id),
      getPendingDailyApprovals(tenantId, employee.id),
    ]);

    return NextResponse.json({
      employee: {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        preferred_name: employee.preferred_name,
        photo_url: employee.photo_url,
        hire_date: employee.hire_date,
      },
      clock: clockStatus,
      briefings: {
        clock_in_gate: briefingGate,
        clock_out_gate: clockOutGate,
        today: todaysBriefings,
        clock_out: clockOutBriefings,
      },
      daily_approval: { gate: approvalGate, pending: pendingApprovals },
      today,
    });
  }

  if (action === 'clock_in') {
    if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    const auth = await verifyPin(tenantId, pin);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const result = await clockIn(tenantId, auth.employee.id, {
      ip_address: ip ?? undefined,
      device_type: 'terminal',
      notes: body.notes,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  if (action === 'clock_out') {
    if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    const auth = await verifyPin(tenantId, pin);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const result = await clockOut(tenantId, auth.employee.id, {
      ip_address: ip ?? undefined,
      device_type: 'terminal',
      notes: body.notes,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  if (action === 'break_start') {
    if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    const auth = await verifyPin(tenantId, pin);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const result = await startBreak(tenantId, auth.employee.id);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  if (action === 'break_end') {
    if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    const auth = await verifyPin(tenantId, pin);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const result = await endBreak(tenantId, auth.employee.id);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  if (action === 'start_briefing') {
    if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    const auth = await verifyPin(tenantId, pin);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const result = await startBriefing(tenantId, body.briefing_id, auth.employee.id, body.opts ?? {});
    return NextResponse.json({ ok: true, result });
  }

  if (action === 'complete_briefing') {
    if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    const auth = await verifyPin(tenantId, pin);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const result = await completeBriefingInteraction(
      tenantId, body.briefing_id, auth.employee.id, body.response, body.passed
    );
    return NextResponse.json({ ok: true, result });
  }

  if (action === 'report_missed_punch') {
    if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    const auth = await verifyPin(tenantId, pin);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const tz = await getTenantTimezone(tenantId);
    const today = todayInTimezone(tz);
    const result = await reportMissedPunch(tenantId, auth.employee.id, body.entry_date ?? today, body.times, body.reason);
    return NextResponse.json({ ok: true, result });
  }

  if (action === 'approve_day') {
    const { employee_id, entry_id } = body;
    if (!employee_id || !entry_id) return NextResponse.json({ error: 'employee_id and entry_id required' }, { status: 400 });
    const { approveDay } = await import('@/lib/workforce/daily-approvals');
    const result = await approveDay(tenantId, employee_id, entry_id);
    return NextResponse.json({ ok: true, result });
  }

  if (action === 'dispute_day') {
    const { employee_id, entry_id, reason } = body;
    if (!employee_id || !entry_id) return NextResponse.json({ error: 'employee_id and entry_id required' }, { status: 400 });
    const { disputeDay } = await import('@/lib/workforce/daily-approvals');
    const result = await disputeDay(tenantId, employee_id, entry_id, reason);
    return NextResponse.json({ ok: true, result });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
