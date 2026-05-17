export async function createTimeOffRequest(tenantId, employeeId, data) { return null; }
export async function getEmployeeTimeOffRequests(tenantId, employeeId) { return []; }
export async function getPendingTimeOffRequests(tenantId) { return []; }
export async function getOverlapsForPendingRequests(tenantId) { return {}; }
export async function getApprovedOverlapForRange(tenantId, employeeId, start, end) { return []; }
export async function getUpcomingApprovedTimeOff(tenantId, days) { return []; }
export async function approveTimeOff(tenantId, requestId, reviewerId, notes) { return null; }
export async function denyTimeOff(tenantId, requestId, reviewerId, notes) { return null; }
export async function cancelTimeOff(tenantId, requestId, employeeId) { return null; }
export async function getEmployeeAccruals(tenantId, employeeId) { return []; }
export async function getApprovedTimeOffInRange(tenantId, employeeId, start, end) { return []; }
