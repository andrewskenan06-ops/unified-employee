import { NextResponse } from 'next/server';
import { getSession, getEmployeeSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { getEmployeeByUserId } from '@/lib/workforce/employees';
import {
  createPersonalTask, listPersonalTasks,
  listPendingTasksForEmployee, completeAssignment,
} from '@/lib/workforce/personal-tasks';

async function getEitherSession() {
  return (await getEmployeeSession()) ?? (await getSession());
}

export async function GET(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  if (view === 'admin') {
    const tasks = await listPersonalTasks(ctx.tenant.id);
    return NextResponse.json({ tasks });
  }

  const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
  if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });

  const tasks = await listPendingTasksForEmployee(ctx.tenant.id, employee.id);
  return NextResponse.json({ tasks });
}

export async function POST(req) {
  const session = await getEitherSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const body = await req.json();
  const { action } = body;

  if (action === 'create') {
    const task = await createPersonalTask(ctx.tenant.id, body);
    return NextResponse.json({ ok: true, task });
  }

  if (action === 'complete') {
    const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
    if (!employee) return NextResponse.json({ error: 'No employee record' }, { status: 404 });
    const result = await completeAssignment(ctx.tenant.id, employee.id, body.assignment_id, body.note);
    return NextResponse.json({ ok: true, result });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
