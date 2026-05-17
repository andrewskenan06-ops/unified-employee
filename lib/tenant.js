// lib/tenant.js
import { sql } from '@/lib/db';

export function getTenantId(request) {
  return request.headers.get("x-tenant-id") ?? null;
}

// Server-side tenant context used by workforce API routes.
// Accepts an optional session object; otherwise reads from the x-tenant-id header.
export async function requireTenantContext(session) {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  const tenantId = session?.tenantId ?? headersList.get('x-tenant-id');

  if (tenantId) {
    const rows = await sql`SELECT id, name FROM tenants WHERE id = ${tenantId} LIMIT 1`;
    if (rows[0]) {
      return {
        tenant: { id: rows[0].id, name: rows[0].name },
        userId: session?.userId ?? session?.employeeId ?? 0,
        modules: new Set(['workforce']),
      };
    }
  }

  // Demo-tenant fallback
  const rows = await sql`SELECT id, name FROM tenants WHERE slug = 'demo' LIMIT 1`;
  if (!rows[0]) throw new Error('No tenant found');
  return {
    tenant: { id: rows[0].id, name: rows[0].name },
    userId: session?.userId ?? session?.employeeId ?? 0,
    modules: new Set(['workforce']),
  };
}
