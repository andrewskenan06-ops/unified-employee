import sql from '@/lib/db';

export async function getBusinessHours(tenantId) {
  const rows = await sql`SELECT * FROM workforce_business_hours WHERE tenant_id = ${tenantId} LIMIT 1`;
  return rows[0] ?? null;
}

export async function ensureAutoSchedule(tenantId) {
  return { created: 0, skipped_reason: 'Auto-schedule not configured' };
}
