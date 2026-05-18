import { NextResponse } from 'next/server';
import { getEmployeeSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const benefits = await sql`
      SELECT * FROM employee_benefits
      WHERE employee_id = ${session.employeeId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ benefits });
  } catch {
    return NextResponse.json({ benefits: [] });
  }
}
