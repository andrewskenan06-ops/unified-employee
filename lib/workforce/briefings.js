export async function listBriefings(tenantId, filters) { return []; }
export async function createBriefing(tenantId, data) { return null; }
export async function publishBriefing(tenantId, id) { return null; }
export async function archiveBriefing(tenantId, id) { return null; }
export async function deleteBriefing(tenantId, id) { return false; }
export async function setBriefingActive(tenantId, id, active) { return null; }
export async function updateBriefing(tenantId, id, data) { return null; }
export async function getTodaysBriefings(tenantId, employeeId, date) { return []; }
export async function getClockOutBriefings(tenantId, employeeId, date) { return []; }
export async function hasCompletedGateBriefings(tenantId, employeeId, date) { return true; }
export async function hasCompletedClockOutBriefings(tenantId, employeeId, date) { return true; }
export async function startBriefing(tenantId, briefingId, employeeId, opts) { return null; }
export async function completeBriefingInteraction(tenantId, briefingId, employeeId, response, passed) { return null; }
export async function getBriefing(tenantId, id) { return null; }
