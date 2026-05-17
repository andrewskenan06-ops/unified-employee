import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getTenantId } from '@/lib/tenant';

export async function POST(request) {
  try {
    const tenantId = getTenantId(request);
    if (!tenantId) return Response.json({ error: 'Tenant required' }, { status: 400 });

    const { pin } = await request.json();
    if (!pin) return Response.json({ error: 'PIN required' }, { status: 400 });

    const users = await sql`
      SELECT id, name, role, job_role AS "jobRole", status
      FROM users
      WHERE pin = ${pin} AND tenant_id = ${tenantId} AND role = 'employee'
    `;

    if (users.length === 0) return Response.json({ error: 'Invalid PIN' }, { status: 401 });
    const user = users[0];
    if (user.status === 'inactive') return Response.json({ error: 'Account inactive' }, { status: 403 });

    const session = {
      employeeId:  user.id,
      displayName: user.name,
      role:        user.role,
      jobRole:     user.jobRole,
      tenantId,
    };

    const res = NextResponse.json({ ok: true, displayName: user.name });
    res.cookies.set('ue_emp_session', JSON.stringify(session), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });
    return res;
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
