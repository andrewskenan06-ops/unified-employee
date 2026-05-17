// lib/auth.js
const SESSION_KEY = "ue_session";
const TENANT_KEY  = "ue_tenant";

// ── Client-side (admin dashboard) ────────────────────────────────

export function setSession(user) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
}

export function logout() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(SESSION_KEY);
  clearTenantId();
}

export function getSession() {
  if (typeof window !== 'undefined') {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }
  // Server-side: read from ue_admin_session cookie (set by future admin cookie login)
  return (async () => {
    try {
      const { cookies } = await import('next/headers');
      const store = await cookies();
      const raw = store.get('ue_admin_session')?.value;
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  })();
}

export function setTenantId(id) {
  if (typeof document !== 'undefined') {
    document.cookie = `${TENANT_KEY}=${id}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

export function getTenantId() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TENANT_KEY}=([^;]*)`));
  return match ? match[1] : null;
}

export function clearTenantId() {
  if (typeof document !== 'undefined') {
    document.cookie = `${TENANT_KEY}=; path=/; max-age=0`;
  }
}

// ── Server-side (employee portal) ───────────────────────────────

export const EMPLOYEE_COOKIE_NAME = 'ue_emp_session';

export function createSessionToken(user, tenantId, employeeId) {
  return JSON.stringify({
    userId: user.id,
    username: user.username,
    role: user.role ?? 'employee',
    displayName: user.display_name ?? user.name ?? '',
    tenantId,
    employeeId,
  });
}

export async function getEmployeeSession() {
  try {
    const { cookies } = await import('next/headers');
    const store = await cookies();
    const raw = store.get(EMPLOYEE_COOKIE_NAME)?.value;
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Normalise both old format {employeeId,displayName,role,tenantId}
    // and new format {userId,username,role,displayName,tenantId,employeeId}
    return {
      userId:      data.userId ?? data.employeeId ?? 0,
      username:    data.username ?? '',
      role:        data.role ?? 'employee',
      displayName: data.displayName ?? data.name ?? '',
      tenantId:    data.tenantId ?? null,
      employeeId:  data.employeeId ?? data.userId ?? null,
    };
  } catch { return null; }
}
