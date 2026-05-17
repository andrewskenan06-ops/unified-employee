export async function getClockStatus(tenantId, employeeId) {
  return { clocked_in: false, hours_today: 0, on_break: false, clock_in_time: null, active_event_id: null };
}
export async function clockIn(tenantId, employeeId, input) {
  return { success: false, error: 'Clock module not configured' };
}
export async function clockOut(tenantId, employeeId, input) {
  return { success: false, error: 'Clock module not configured' };
}
export async function startBreak(tenantId, employeeId) {
  return { success: false, error: 'Clock module not configured' };
}
export async function endBreak(tenantId, employeeId) {
  return { success: false, error: 'Clock module not configured' };
}
