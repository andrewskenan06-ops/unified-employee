import { NextResponse } from 'next/server';
import { getSession, getEmployeeSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { getEmployeeByUserId } from '@/lib/workforce/employees';
import {
  createTimeOffRequest, getEmployeeTimeOffRequests, getPendingTimeOffRequests,
  getOverlapsForPendingRequests, getApprovedOverlapForRange, getUpcomingApprovedTimeOff,
  approveTimeOff, denyTimeOff, cancelTimeOff, getEmployeeAccruals,
} from '@/lib/workforce/time-off';
import sql from '@/lib/db';

async function getEitherSession() {
  return (await getEmployeeSession()) ?? (await getSession());
}

export async function GET(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  if (view === 'admin_pending') {
    const [pending, overlaps, upcoming] = await Promise.all([
      getPendingTimeOffRequests(ctx.tenant.id),
      getOverlapsForPendingRequests(ctx.tenant.id),
      getUpcomingApprovedTimeOff(ctx.tenant.id, 30),
    ]);
    return NextResponse.json({ pending, overlaps, upcoming });
  }

  const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
  if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });

  const [requests, accruals] = await Promise.all([
    getEmployeeTimeOffRequests(ctx.tenant.id, employee.id),
    getEmployeeAccruals(ctx.tenant.id, employee.id).catch(() => []),
  ]);

  const startParam = searchParams.get('overlap_start');
  const endParam = searchParams.get('overlap_end');
  let overlaps = [];
  if (startParam && endParam) {
    overlaps = await getApprovedOverlapForRange(ctx.tenant.id, employee.id, startParam, endParam);
  }

  return NextResponse.json({ requests, accruals, overlaps });
}

export async function POST(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const { action } = body;

  if (action === 'approve' || action === 'deny') {
    const { requestId, notes } = body;
    const reviewerId = ctx.userId;
    const result = action === 'approve'
      ? await approveTimeOff(ctx.tenant.id, requestId, reviewerId, notes)
      : await denyTimeOff(ctx.tenant.id, requestId, reviewerId, notes);
    return NextResponse.json({ ok: true, result });
  }

  if (action === 'cancel') {
    const { requestId } = body;
    const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
    if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
    const result = await cancelTimeOff(ctx.tenant.id, requestId, employee.id);
    return NextResponse.json({ ok: true, result });
  }

  const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
  if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });

  const { type, start_date, end_date, notes, hours_requested } = body;
  if (!type || !start_date || !end_date) {
    return NextResponse.json({ error: 'type, start_date, end_date are required' }, { status: 400 });
  }

  const result = await createTimeOffRequest(ctx.tenant.id, employee.id, {
    type, start_date, end_date, notes, hours_requested,
  });

  return NextResponse.json({ ok: true, request: result });
}
