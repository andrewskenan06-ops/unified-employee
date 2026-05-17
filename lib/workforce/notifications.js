export async function sendNotification(opts) { return { sent: false }; }
export async function notifyAllEmployees(tenantId, category, title, message, opts) { return 0; }
export async function notifyEmployees(tenantId, employeeIds, category, title, message, opts) { return 0; }
export async function notifySchedulePublished(tenantId, employeeId, date, startTime, endTime) {}
export async function notifyBriefingAvailable(tenantId, employeeId, title) {}
