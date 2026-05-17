import { NextResponse } from 'next/server';
import { getSession, getEmployeeSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { getEmployeeByUserId } from '@/lib/workforce/employees';
import {
  getWeekSchedules, getEmployeeSchedule, getCoworkersByDate,
  createSchedule, createBulkSchedules, publishWeekSchedules,
  confirmSchedule, copyWeekSchedule, copyMonthSchedule,
  applyScheduleTemplate, saveWeekAsTemplate, listScheduleTemplates, listShiftTemplates,
  findScheduleConflicts,
} from '@/lib/workforce/schedules';
import { notifySchedulePublished } from '@/lib/workforce/notifications';

async function getEitherSession() {
  return (await getEmployeeSession()) ?? (await getSession());
}

export async function GET(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');
  const startDate = searchParams.get('start') ?? searchParams.get('start_date');
  const endDate = searchParams.get('end') ?? searchParams.get('end_date');

  if (view === 'admin') {
    const [schedules, templates, shiftTemplates] = await Promise.all([
      getWeekSchedules(ctx.tenant.id, startDate, endDate, {}),
      listScheduleTemplates(ctx.tenant.id, null),
      listShiftTemplates(ctx.tenant.id),
    ]);
    return NextResponse.json({ schedules, templates, shift_templates: shiftTemplates });
  }

  if (view === 'templates') {
    const departmentId = searchParams.get('department_id');
    const templates = await listScheduleTemplates(ctx.tenant.id, departmentId);
    return NextResponse.json({ templates });
  }

  const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
  if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });

  const [schedule, coworkers] = await Promise.all([
    getEmployeeSchedule(ctx.tenant.id, employee.id, startDate, endDate),
    getCoworkersByDate(ctx.tenant.id, employee.id, startDate, endDate),
  ]);

  return NextResponse.json({ schedule, coworkers });
}

export async function POST(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const { action } = body;

  if (action === 'bulk_create') {
    const conflicts = await findScheduleConflicts(ctx.tenant.id, body.entries ?? []);
    if (conflicts.length > 0) return NextResponse.json({ conflicts }, { status: 409 });
    const created = await createBulkSchedules(ctx.tenant.id, body.entries ?? []);
    return NextResponse.json({ ok: true, created });
  }

  if (action === 'publish') {
    const count = await publishWeekSchedules(ctx.tenant.id, body.week_start, body.week_end);
    return NextResponse.json({ ok: true, published: count });
  }

  if (action === 'confirm') {
    const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
    if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
    const result = await confirmSchedule(ctx.tenant.id, body.schedule_id, employee.id);
    return NextResponse.json({ ok: true, result });
  }

  if (action === 'copy_week') {
    const result = await copyWeekSchedule(ctx.tenant.id, body.source_week, body.target_week, ctx.userId);
    return NextResponse.json({ ok: true, ...result });
  }

  if (action === 'copy_month') {
    const result = await copyMonthSchedule(ctx.tenant.id, body.source_month, body.target_month, ctx.userId);
    return NextResponse.json({ ok: true, ...result });
  }

  if (action === 'apply_template') {
    const result = await applyScheduleTemplate(ctx.tenant.id, body.template_id, body.target_week, ctx.userId);
    return NextResponse.json({ ok: true, ...result });
  }

  if (action === 'save_template') {
    const result = await saveWeekAsTemplate(ctx.tenant.id, body.week_start, body.name, body.department_id, ctx.userId);
    return NextResponse.json({ ok: true, template: result });
  }

  const result = await createSchedule(ctx.tenant.id, body);
  return NextResponse.json({ ok: true, schedule: result });
}
