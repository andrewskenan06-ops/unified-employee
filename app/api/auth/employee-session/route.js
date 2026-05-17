import { NextResponse } from 'next/server';
import { getEmployeeSession } from '@/lib/auth';

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({
    authenticated: true,
    username:    session.username,
    role:        session.role,
    displayName: session.displayName,
    employeeId:  session.employeeId,
    tenantId:    session.tenantId,
  });
}
