export async function GET(request) {
  const cookie = request.cookies.get('ue_emp_session')?.value;
  if (!cookie) return Response.json({ authenticated: false }, { status: 401 });

  try {
    const session = JSON.parse(cookie);
    if (!session?.employeeId) return Response.json({ authenticated: false }, { status: 401 });
    return Response.json({ authenticated: true, ...session });
  } catch {
    return Response.json({ authenticated: false }, { status: 401 });
  }
}
