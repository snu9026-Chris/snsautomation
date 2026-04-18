import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // API routes, static 파일, OAuth 콜백은 인증 제외
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.endsWith('.png') ||
    request.nextUrl.pathname.endsWith('.txt') ||
    request.nextUrl.pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // 쿠키 기반 인증 체크
  const session = request.cookies.get('loopdrop-session');
  const response = NextResponse.next();

  // 인증 상태를 헤더로 전달 (클라이언트에서 참조하지 않음, 로깅용)
  if (session?.value === 'authenticated') {
    response.headers.set('x-loopdrop-auth', 'true');
  }

  // 인증 안 되어도 통과 — 클라이언트에서 AuthProvider가 처리
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
