export async function getWeekSchedules(tenantId, startDate, endDate, opts) { return []; }
export async function getEmployeeSchedule(tenantId, employeeId, startDate, endDate) { return []; }
export async function getCoworkersByDate(tenantId, employeeId, startDate, endDate) { return {}; }
export async function createSchedule(tenantId, data) { return null; }
export async function createBulkSchedules(tenantId, data) { return []; }
export async function publishWeekSchedules(tenantId, weekStart, weekEnd) { return 0; }
export async function confirmSchedule(tenantId, scheduleId, employeeId) { return null; }
export async function copyWeekSchedule(tenantId, sourceWeek, targetWeek, createdBy) { return { created: 0 }; }
export async function copyMonthSchedule(tenantId, sourceMonth, targetMonth, createdBy) { return { created: 0 }; }
export async function applyScheduleTemplate(tenantId, templateId, targetWeek, createdBy) { return { created: 0 }; }
export async function saveWeekAsTemplate(tenantId, weekStart, name, departmentId, createdBy) { return null; }
export async function listScheduleTemplates(tenantId, departmentId) { return []; }
export async function listShiftTemplates(tenantId) { return []; }
export async function findScheduleConflicts(tenantId, entries) { return []; }
export async function getScheduledShiftReminder(tenantId, employeeId) { return null; }
