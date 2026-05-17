import { NextResponse } from "next/server";

export function middleware(request) {
  const tenantId = request.cookies.get("ue_tenant")?.value;
  if (!tenantId) return NextResponse.next();

  const headers = new Headers(request.headers);
  headers.set("x-tenant-id", tenantId);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: "/api/:path*",
};
