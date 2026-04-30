import { NextResponse } from 'next/server';

const AUTH_USER = process.env.AUTH_USER;
const AUTH_PASS = process.env.AUTH_PASS;

export async function POST(request: Request) {
  if (!AUTH_USER || !AUTH_PASS) {
    return NextResponse.json({ error: '서버 인증 설정이 되어있지 않습니다.' }, { status: 500 });
  }

  const { username, password } = await request.json();

  if (username === AUTH_USER && password === AUTH_PASS) {
    const response = NextResponse.json({ success: true });
    const cookieOpts = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 30, // 30일
      path: '/',
    };
    response.cookies.set('loopdrop-session', 'authenticated', { ...cookieOpts, httpOnly: true });
    response.cookies.set('loopdrop-ui', '1', { ...cookieOpts, httpOnly: false }); // 클라이언트 즉시 판별용
    return response;
  }

  return NextResponse.json({ error: '아이디 또는 비밀번호가 틀렸습니다.' }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('loopdrop-session');
  response.cookies.delete('loopdrop-ui');
  return response;
}
