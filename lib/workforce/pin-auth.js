import crypto from 'crypto';
import sql from '@/lib/db';

export function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

export async function verifyPin(tenantId, pin) {
  const hash = hashPin(pin);
  const rows = await sql`
    SELECT * FROM workforce_employees
    WHERE tenant_id = ${tenantId} AND pin_hash = ${hash} AND employment_status = 'active'
    LIMIT 1
  `;
  if (!rows[0]) return { success: false, error: 'Invalid PIN' };
  return { success: true, employee: rows[0] };
}

export async function setEmployeePin(tenantId, employeeId, pin) {
  if (!/^\d{4,6}$/.test(pin)) return { success: false, error: 'PIN must be 4-6 digits' };
  const hash = hashPin(pin);
  await sql`
    UPDATE workforce_employees SET pin_hash = ${hash}, updated_at = NOW()
    WHERE tenant_id = ${tenantId} AND id = ${employeeId}
  `;
  return { success: true };
}

export async function getTenantTimezone(tenantId) {
  const rows = await sql`SELECT timezone FROM tenants WHERE id = ${tenantId} LIMIT 1`;
  return rows[0]?.timezone ?? 'America/New_York';
}

export function todayInTimezone(tz) {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
}
