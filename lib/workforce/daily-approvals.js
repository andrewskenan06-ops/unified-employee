export async function approveDay(tenantId, employeeId, entryId) { return null; }
export async function disputeDay(tenantId, employeeId, entryId, reason) { return null; }
export async function resolveDispute(tenantId, entryId, reviewerId, opts) { return null; }
export async function getPendingDailyApprovals(tenantId, employeeId) { return []; }
export async function getDisputedEntries(tenantId) { return []; }
export async function checkClockInApprovalGate(tenantId, employeeId) { return { blocked: false, pending_count: 0 }; }
export async function reportMissedPunch(tenantId, employeeId, entryDate, times, reason) { return null; }
