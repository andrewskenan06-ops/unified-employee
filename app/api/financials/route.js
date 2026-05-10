import sql from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const rows = month
      ? await sql`SELECT * FROM financial_entries WHERE month = ${month} ORDER BY section, id`
      : await sql`SELECT * FROM financial_entries ORDER BY section, id`;
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { section, label, amount, month, notes } = await request.json();
    const rows = await sql`
      INSERT INTO financial_entries (section, label, amount, month, notes)
      VALUES (${section}, ${label}, ${amount}, ${month}, ${notes ?? null})
      RETURNING *`;
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
