import sql from "@/lib/db";
import { requireTenantContext } from "@/lib/tenant";

export async function GET() {
  try {
    const { tenant } = await requireTenantContext();
    const rows = await sql`
      SELECT name, logo_url, primary_color, accent_color
      FROM tenants WHERE id = ${tenant.id} LIMIT 1
    `;
    const t = rows[0] ?? {};
    return Response.json({
      company_name:  t.name          ?? "Unified Employee",
      logo_url:      t.logo_url      ?? null,
      primary_color: t.primary_color ?? "#023f62",
      accent_color:  t.accent_color  ?? "#00ce7c",
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { tenant } = await requireTenantContext();
    const { company_name, logo_url, primary_color, accent_color } = await request.json();

    await sql`
      UPDATE tenants SET
        name          = COALESCE(${company_name  ?? null}, name),
        logo_url      = COALESCE(${logo_url      ?? null}, logo_url),
        primary_color = COALESCE(${primary_color ?? null}, primary_color),
        accent_color  = COALESCE(${accent_color  ?? null}, accent_color)
      WHERE id = ${tenant.id}
    `;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
