import sql from "@/lib/db";

export async function GET() {
  try {
    const employees = await sql`
      SELECT id, name, username, job_role AS "jobRole"
      FROM users WHERE role = 'employee'
      ORDER BY name`;
    return Response.json(employees);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
