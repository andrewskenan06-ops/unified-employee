import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('ue_emp_session', '', { maxAge: 0, path: '/' });
  return res;
}
