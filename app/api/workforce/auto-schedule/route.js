import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { ensureAutoSchedule } from '@/lib/workforce/business-hours';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const result = await ensureAutoSchedule(ctx.tenant.id);
  return NextResponse.json({ ok: true, ...result });
}
