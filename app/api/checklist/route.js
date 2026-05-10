import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM checklist_questions
      ORDER BY job_role, direction, sort_order`;
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { job_role, direction, message, type, button_text, sort_order, video_url } = await request.json();
    const rows = await sql`
      INSERT INTO checklist_questions (job_role, direction, message, type, button_text, sort_order, video_url)
      VALUES (${job_role}, ${direction}, ${message}, ${type}, ${button_text ?? "Okay"}, ${sort_order ?? 0}, ${video_url ?? null})
      RETURNING *`;
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
