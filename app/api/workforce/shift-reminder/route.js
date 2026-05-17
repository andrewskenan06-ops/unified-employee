import { NextResponse } from 'next/server';
import { getEmployeeSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { getEmployeeByUserId } from '@/lib/workforce/employees';
import { getScheduledShiftReminder } from '@/lib/workforce/schedules';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
  if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });

  const reminder = await getScheduledShiftReminder(ctx.tenant.id, employee.id);
  return NextResponse.json({ reminder });
}
