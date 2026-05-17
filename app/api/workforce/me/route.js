import { NextResponse } from 'next/server';
import { getEmployeeSession } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { getEmployeeByUserId } from '@/lib/workforce/employees';
import { getClockStatus } from '@/lib/workforce/clock';
import { hasCompletedGateBriefings, hasCompletedClockOutBriefings, getTodaysBriefings, getClockOutBriefings } from '@/lib/workforce/briefings';
import { checkClockInApprovalGate, getPendingDailyApprovals } from '@/lib/workforce/daily-approvals';
import { getEarningsToday, getOnTimeStreak, getAttendanceMetrics, getRecentHours } from '@/lib/workforce/attendance';
import { getBranding, tenureDescription } from '@/lib/workforce/branding';
import { getEmployeeAccruals } from '@/lib/workforce/time-off';

export async function GET() {
  const session = await getEmployeeSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await requireTenantContext(session);
  const employee = await getEmployeeByUserId(ctx.tenant.id, ctx.userId);
  if (!employee) return NextResponse.json({ error: 'No employee record linked to this user' }, { status: 404 });

  const today = new Date().toISOString().split('T')[0];
  const [clockStatus, briefingGate, clockOutGate, todaysBriefings, clockOutBriefings, approvalGate, pendingApprovals, accruals] = await Promise.all([
    getClockStatus(ctx.tenant.id, employee.id),
    hasCompletedGateBriefings(ctx.tenant.id, employee.id, today),
    hasCompletedClockOutBriefings(ctx.tenant.id, employee.id, today),
    getTodaysBriefings(ctx.tenant.id, employee.id, today),
    getClockOutBriefings(ctx.tenant.id, employee.id, today),
    checkClockInApprovalGate(ctx.tenant.id, employee.id),
    getPendingDailyApprovals(ctx.tenant.id, employee.id),
    getEmployeeAccruals(ctx.tenant.id, employee.id).catch(() => []),
  ]);

  const attendance = await buildAttendanceSummary(ctx.tenant.id, employee.id, clockStatus.hours_today, `${employee.first_name} ${employee.last_name}`);
  const branding = await getBranding(ctx.tenant.id);

  return NextResponse.json({
    employee: {
      id: employee.id,
      employee_number: employee.employee_number,
      first_name: employee.first_name,
      last_name: employee.last_name,
      preferred_name: employee.preferred_name,
      email: employee.email,
      phone: employee.phone,
      department_id: employee.department_id,
      position_id: employee.position_id,
      employment_type: employee.employment_type,
      hire_date: employee.hire_date,
      photo_url: employee.photo_url,
      geo_fence_enabled: employee.geo_fence_enabled,
      allow_mobile_clock: employee.allow_mobile_clock,
    },
    clock: clockStatus,
    briefings: {
      clock_in_gate: briefingGate,
      clock_out_gate: clockOutGate,
      today: todaysBriefings.map(b => ({
        id: b.id, title: b.title, content_type: b.content_type,
        video_url: b.video_url, video_playback_id: b.video_playback_id,
        video_duration_sec: b.video_duration_sec, audio_url: b.audio_url,
        audio_duration_sec: b.audio_duration_sec, text_content: b.text_content,
        thumbnail_url: b.thumbnail_url, interaction_required: b.interaction_required,
        interaction_type: b.interaction_type, interaction_prompt: b.interaction_prompt,
        interaction_config: b.interaction_config, min_watch_pct: b.min_watch_pct,
        gates_clock_in: b.gates_clock_in, gates_clock_out: b.gates_clock_out ?? false,
        briefing_category: b.briefing_category ?? 'culture', completion: b.completion,
      })),
      clock_out: clockOutBriefings.map(b => ({
        id: b.id, title: b.title, content_type: b.content_type,
        text_content: b.text_content, interaction_required: b.interaction_required,
        interaction_type: b.interaction_type, interaction_prompt: b.interaction_prompt,
        interaction_config: b.interaction_config,
        briefing_category: b.briefing_category ?? 'culture', completion: b.completion,
      })),
    },
    daily_approval: { gate: approvalGate, pending: pendingApprovals },
    attendance,
    branding,
    tenure: tenureDescription(employee.hire_date),
    accruals: accruals.map(a => ({
      accrual_type: a.accrual_type,
      balance_hours: Number(a.balance_hours) || 0,
      max_balance: a.max_balance != null ? Number(a.max_balance) : null,
    })),
    today,
  });
}

async function buildAttendanceSummary(tenantId, employeeId, hoursToday, fullName) {
  try {
    const [earnings, streak, recentHours] = await Promise.all([
      getEarningsToday(tenantId, employeeId, hoursToday),
      getOnTimeStreak(tenantId, employeeId),
      getRecentHours(tenantId, employeeId, fullName),
    ]);
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    const fmt = d => d.toISOString().split('T')[0];
    const metrics = await getAttendanceMetrics(tenantId, employeeId, fmt(start), fmt(today));
    return { earnings, streak_days: streak, last_30_days: metrics, recent_hours: recentHours };
  } catch (err) {
    console.warn('[me] attendance summary skipped:', err);
    return { earnings: null, streak_days: 0, last_30_days: null, recent_hours: null };
  }
}
