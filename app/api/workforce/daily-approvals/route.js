import { NextResponse } from 'next/server';
import { getSession, getEmployeeSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { getEmployeeByUserId } from '@/lib/workforce/employees';
import {
  approveDay, disputeDay, resolveDispute,
  getPendingDailyApprovals, getDisputedEntries,
  checkClockInApprovalGate, reportMissedPunch,
} from '@/lib/workforce/daily-approvals';

async function resolveEmployeeContext(ctx) {
  const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
  return employee ?? null;
}

async function getEitherSession() {
  return (await getEmployeeSession()) ?? (await getSession());
}

export async function GET(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  if (view === 'disputed') {
    const entries = await getDisputedEntries(ctx.tenant.id);
    return NextResponse.json({ entries });
  }

  if (view === 'gate') {
    const employee = await resolveEmployeeContext(ctx);
    if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
    const gate = await checkClockInApprovalGate(ctx.tenant.id, employee.id);
    return NextResponse.json(gate);
  }

  const employee = await resolveEmployeeContext(ctx);
  if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
  const pending = await getPendingDailyApprovals(ctx.tenant.id, employee.id);
  return NextResponse.json({ pending });
}

export async function POST(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const { action } = body;

  if (action === 'approve') {
    const employee = await resolveEmployeeContext(ctx);
    if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
    const result = await approveDay(ctx.tenant.id, employee.id, body.entry_id);
    return NextResponse.json({ ok: true, result });
  }

  if (action === 'dispute') {
    const employee = await resolveEmployeeContext(ctx);
    if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
    const result = await disputeDay(ctx.tenant.id, employee.id, body.entry_id, body.reason);
    return NextResponse.json({ ok: true, result });
  }

  if (action === 'resolve_dispute') {
    const result = await resolveDispute(ctx.tenant.id, body.entry_id, ctx.userId, {
      resolution: body.resolution,
      notes: body.notes,
    });
    return NextResponse.json({ ok: true, result });
  }

  if (action === 'report_missed_punch') {
    const employee = await resolveEmployeeContext(ctx);
    if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
    const result = await reportMissedPunch(
      ctx.tenant.id, employee.id, body.entry_date, body.times, body.reason
    );
    return NextResponse.json({ ok: true, result });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
