export async function createPayrollRun(tenantId, periodStart, periodEnd, payDate, createdBy) {
  throw new Error('Payroll module not configured');
}
export async function createCheckPayroll(tenantId, runId) { return { ok: false, error: 'Not configured' }; }
export async function getCheckPayrollStatus(tenantId, runId) { return { status: 'unknown' }; }
export async function syncEmployeeToCheck(tenantId, employeeId) { return { ok: false, error: 'Not configured' }; }
