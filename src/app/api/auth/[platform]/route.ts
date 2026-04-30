import { NextResponse } from 'next/server';
import { OAUTH_CONFIGS, OAUTH_REDIRECT_URI } from '@/lib/oauth-config';
import type { OAuthPlatform } from '@/lib/oauth-config';
import { buildOAuthStateCookie, requireAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const { platform } = await params;

  const config = OAUTH_CONFIGS[platform as OAuthPlatform];
  if (!config) {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
  }

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) {
    return NextResponse.json(
      { error: `${platform} OAuth가 설정되지 않았습니다. ${config.clientIdEnv} 환경변수를 확인하세요.` },
      { status: 500 }
    );
  }

  // state에 platform 정보를 담아서 callback에서 식별
  // PKCE는 43~128자 요구 → 32바이트 hex = 64자 생성
  const randomPart = crypto.randomBytes(32).toString('hex');
  const state = `${platform}:${randomPart}`;

  // TikTok uses `client_key`, others use `client_id`
  const clientKeyParam = platform === 'tiktok' ? 'client_key' : 'client_id';

  const authParams = new URLSearchParams({
    [clientKeyParam]: clientId,
    redirect_uri: OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: config.scopes.join(platform === 'tiktok' ? ',' : ' '),
    state,
    ...config.extraAuthParams,
  });

  // X(Twitter) PKCE: code_challenge = randomPart (plain method)
  if (platform === 'x') {
    authParams.set('code_challenge', randomPart);
  }

  const redirectUrl = `${config.authUrl}?${authParams.toString()}`;
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(buildOAuthStateCookie(state));
  return response;
}
