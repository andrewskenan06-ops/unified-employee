const SESSION_KEY = "ue_session";
const TENANT_KEY  = "ue_tenant";

export function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  clearTenantId();
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function setTenantId(id) {
  document.cookie = `${TENANT_KEY}=${id}; path=/; max-age=31536000; SameSite=Lax`;
}

export function getTenantId() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TENANT_KEY}=([^;]*)`));
  return match ? match[1] : null;
}

export function clearTenantId() {
  document.cookie = `${TENANT_KEY}=; path=/; max-age=0`;
}
