import { NextResponse } from 'next/server';
import { getSession, getEmployeeSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { notifyAllEmployees, notifyEmployees } from '@/lib/workforce/notifications';
import sql from '@/lib/db';

async function getEitherSession() {
  return (await getEmployeeSession()) ?? (await getSession());
}

export async function GET(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employee_id');
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  if (employeeId) {
    const rows = await sql`
      SELECT * FROM workforce_notifications
      WHERE tenant_id = ${ctx.tenant.id} AND employee_id = ${employeeId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return NextResponse.json({ notifications: rows });
  }

  const rows = await sql`
    SELECT * FROM workforce_notifications
    WHERE tenant_id = ${ctx.tenant.id}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return NextResponse.json({ notifications: rows });
}

export async function POST(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const { action } = body;

  if (action === 'notify_all') {
    const { category, title, message, opts } = body;
    const count = await notifyAllEmployees(ctx.tenant.id, category, title, message, opts);
    return NextResponse.json({ ok: true, sent: count });
  }

  if (action === 'notify_employees') {
    const { employee_ids, category, title, message, opts } = body;
    const count = await notifyEmployees(ctx.tenant.id, employee_ids, category, title, message, opts);
    return NextResponse.json({ ok: true, sent: count });
  }

  if (action === 'mark_read') {
    const { notification_id } = body;
    await sql`
      UPDATE workforce_notifications
      SET read_at = NOW()
      WHERE id = ${notification_id} AND tenant_id = ${ctx.tenant.id}
    `;
    return NextResponse.json({ ok: true });
  }

  if (action === 'mark_all_read') {
    const { employee_id } = body;
    await sql`
      UPDATE workforce_notifications
      SET read_at = NOW()
      WHERE tenant_id = ${ctx.tenant.id} AND employee_id = ${employee_id} AND read_at IS NULL
    `;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
