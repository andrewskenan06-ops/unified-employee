import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { getEmployeeByUserId } from '@/lib/workforce/employees';
import { clockIn, clockOut, startBreak, endBreak, getClockStatus } from '@/lib/workforce/clock';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ctx = await requireTenantContext();
  const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
  if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
  const status = await getClockStatus(ctx.tenant.id, employee.id);
  return NextResponse.json(status);
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ctx = await requireTenantContext();
  const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
  if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
  const body = await req.json();
  const { action, latitude, longitude, geo_accuracy_m, notes } = body;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;
  const deviceType = /mobile|android|iphone|ipad/i.test(userAgent ?? '') ? 'mobile' : 'desktop';
  const input = { latitude, longitude, geo_accuracy_m, ip_address: ip ?? undefined, device_type: deviceType, user_agent: userAgent ?? undefined, notes };
  let result;
  switch (action) {
    case 'clock_in':    result = await clockIn(ctx.tenant.id, employee.id, input); break;
    case 'clock_out':   result = await clockOut(ctx.tenant.id, employee.id, input); break;
    case 'break_start': result = await startBreak(ctx.tenant.id, employee.id); break;
    case 'break_end':   result = await endBreak(ctx.tenant.id, employee.id); break;
    default: return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
