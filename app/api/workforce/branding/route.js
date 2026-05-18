import { NextResponse } from 'next/server';
import { getEmployeeSession } from '@/lib/auth';
import { getBranding } from '@/lib/workforce/branding';

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const branding = await getBranding(session.tenantId);
  return NextResponse.json(branding ?? {});
}
