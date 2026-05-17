import { NextResponse } from 'next/server';
import { getSession, getEmployeeSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { getEmployeeByUserId } from '@/lib/workforce/employees';
import {
  listBriefings, createBriefing, publishBriefing, archiveBriefing,
  deleteBriefing, setBriefingActive, updateBriefing,
  startBriefing, completeBriefingInteraction, getBriefing,
} from '@/lib/workforce/briefings';

async function getEitherSession() {
  return (await getEmployeeSession()) ?? (await getSession());
}

export async function GET(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');
  const id = searchParams.get('id');

  if (id) {
    const briefing = await getBriefing(ctx.tenant.id, id);
    if (!briefing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ briefing });
  }

  const filters = {
    status: searchParams.get('status'),
    category: searchParams.get('category'),
    gates_clock_in: searchParams.get('gates_clock_in') === 'true' ? true : undefined,
  };

  const briefings = await listBriefings(ctx.tenant.id, filters);
  return NextResponse.json({ briefings });
}

export async function POST(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const { action } = body;

  if (action === 'create') {
    const briefing = await createBriefing(ctx.tenant.id, body);
    return NextResponse.json({ ok: true, briefing });
  }

  if (action === 'update') {
    const { id, ...data } = body;
    const briefing = await updateBriefing(ctx.tenant.id, id, data);
    return NextResponse.json({ ok: true, briefing });
  }

  if (action === 'publish') {
    const briefing = await publishBriefing(ctx.tenant.id, body.id);
    return NextResponse.json({ ok: true, briefing });
  }

  if (action === 'archive') {
    const briefing = await archiveBriefing(ctx.tenant.id, body.id);
    return NextResponse.json({ ok: true, briefing });
  }

  if (action === 'delete') {
    const ok = await deleteBriefing(ctx.tenant.id, body.id);
    return NextResponse.json({ ok });
  }

  if (action === 'set_active') {
    const briefing = await setBriefingActive(ctx.tenant.id, body.id, body.active);
    return NextResponse.json({ ok: true, briefing });
  }

  if (action === 'start') {
    const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
    if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
    const result = await startBriefing(ctx.tenant.id, body.briefing_id, employee.id, body.opts ?? {});
    return NextResponse.json({ ok: true, result });
  }

  if (action === 'complete') {
    const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
    if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
    const result = await completeBriefingInteraction(
      ctx.tenant.id, body.briefing_id, employee.id, body.response, body.passed
    );
    return NextResponse.json({ ok: true, result });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
