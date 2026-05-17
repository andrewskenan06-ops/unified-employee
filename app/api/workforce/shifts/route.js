import { NextResponse } from 'next/server';
import { getEmployeeSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { getEmployeeByUserId } from '@/lib/workforce/employees';
import { getRecentShifts } from '@/lib/workforce/attendance';

export async function GET(req) {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
  if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') ?? '14', 10);
  const fullName = `${employee.first_name} ${employee.last_name}`;

  const shifts = await getRecentShifts(ctx.tenant.id, employee.id, fullName, days);
  return NextResponse.json({ shifts });
}
