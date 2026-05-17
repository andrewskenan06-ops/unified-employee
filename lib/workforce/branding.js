import { sql } from '@/lib/db';

export async function getBranding(tenantId) {
  try {
    const rows = await sql`SELECT name, logo_url, primary_color FROM tenants WHERE id = ${tenantId} LIMIT 1`;
    const t = rows[0];
    return { company_name: t?.name ?? 'Unified Employee', logo_url: t?.logo_url ?? null, primary_color: t?.primary_color ?? null };
  } catch { return { company_name: 'Unified Employee', logo_url: null, primary_color: null }; }
}

export function tenureDescription(hireDate) {
  if (!hireDate) return null;
  const ms = Date.now() - new Date(hireDate).getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'}`;
}
