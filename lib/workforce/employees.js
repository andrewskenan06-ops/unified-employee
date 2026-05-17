import sql from '@/lib/db';

export async function getEmployeeByUserId(tenantId, userId) {
  if (!userId) return null;
  const rows = await sql`
    SELECT * FROM workforce_employees
    WHERE tenant_id = ${tenantId} AND user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getEmployee(tenantId, employeeId) {
  if (!employeeId) return null;
  const rows = await sql`
    SELECT * FROM workforce_employees
    WHERE tenant_id = ${tenantId} AND id = ${employeeId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function listEmployees(tenantId, filters = {}) {
  const rows = await sql`
    SELECT * FROM workforce_employees
    WHERE tenant_id = ${tenantId} AND employment_status = 'active'
    ORDER BY last_name, first_name
  `;
  return rows;
}
