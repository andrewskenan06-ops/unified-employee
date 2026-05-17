import sql from "@/lib/db";

// GET /api/tenants/[slug] — resolve a slug to tenant id + name
export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const rows = await sql`SELECT id, name FROM tenants WHERE slug = ${slug}`;
    if (!rows.length) return Response.json({ error: "Company not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
