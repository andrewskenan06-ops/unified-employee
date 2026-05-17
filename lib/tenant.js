export function getTenantId(request) {
  return request.headers.get("x-tenant-id") ?? null;
}
