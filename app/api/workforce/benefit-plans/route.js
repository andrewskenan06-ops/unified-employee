import { NextResponse } from 'next/server';
import { getEmployeeSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const plans = await sql`
      SELECT * FROM workforce_benefit_plans
      WHERE tenant_id = ${session.tenantId} AND is_active = true
      ORDER BY benefit_type, name
    `;
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ plans: [] });
  }
}
