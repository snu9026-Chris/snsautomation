import { NextResponse } from 'next/server';
import { OAUTH_CONFIGS, OAUTH_REDIRECT_URI } from '@/lib/oauth-config';
import type { OAuthPlatform } from '@/lib/oauth-config';
import { createClient } from '@supabase/supabase-js';
import { OAUTH_STATE_COOKIE_NAME, readOAuthStateCookie } from '@/lib/auth';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

function redirectAndClearState(url: string) {
  const response = NextResponse.redirect(url);
  response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
  return response;
}

function safeStateEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return redirectAndClearState(`${BASE_URL}/accounts?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return redirectAndClearState(`${BASE_URL}/accounts?error=missing_params`);
  }

  // state CSRF 검증: 시작 시 쿠키에 저장한 값과 비교
  const storedState = await readOAuthStateCookie();
  if (!storedState || !safeStateEquals(storedState, state)) {
    return redirectAndClearState(`${BASE_URL}/accounts?error=invalid_state`);
  }

  // state에서 platform 추출: "platform:random"
  const platform = state.split(':')[0] as OAuthPlatform;
  const config = OAUTH_CONFIGS[platform];

  if (!config) {
    return redirectAndClearState(`${BASE_URL}/accounts?error=unknown_platform`);
  }

  const clientId = process.env[config.clientIdEnv]!;
  const clientSecret = process.env[config.clientSecretEnv]!;

  try {
    // 1. Authorization code → Access token 교환
    // TikTok uses client_key instead of client_id
    const tokenBody: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: OAUTH_REDIRECT_URI,
      client_secret: clientSecret,
    };
    if (platform === 'tiktok') {
      tokenBody.client_key = clientId;
    } else {
      tokenBody.client_id = clientId;
    }

    // X(Twitter) PKCE: state = "x:randomPart", verifier = randomPart
    if (platform === 'x') {
      tokenBody.code_verifier = state.split(':').slice(1).join(':');
    }

    const tokenRes = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': platform === 'x'
          ? 'application/x-www-form-urlencoded'
          : 'application/x-www-form-urlencoded',
        ...(platform === 'x' ? {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        } : {}),
      },
      body: new URLSearchParams(tokenBody).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error('Token exchange failed:', tokenData);
      return redirectAndClearState(
        `${BASE_URL}/accounts?error=${encodeURIComponent(tokenData.error_description || tokenData.error || 'token_exchange_failed')}`
      );
    }

    let accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || null;

    // Threads: 단기 토큰(1시간) → 장기 토큰(60일)으로 교환
    if (platform === 'threads') {
      try {
        const longLivedRes = await fetch(
          `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${clientSecret}&access_token=${accessToken}`
        );
        const longLivedData = await longLivedRes.json();
        if (longLivedData.access_token) {
          accessToken = longLivedData.access_token;
        }
      } catch (err) {
        console.error('Threads long-lived token exchange failed:', err);
      }
    }

    // Google returns expires_in=3600 (1hr) but refresh token allows indefinite renewal.
    const rawExpiresIn = tokenData.expires_in || 5184000;
    const expiresIn = (refreshToken && rawExpiresIn < 86400) || platform === 'threads'
      ? 5184000  // refresh token 있거나 Threads면 60일로 표시
      : rawExpiresIn;

    // 2. 사용자 정보 조회
    let accountName = `@${platform}_user`;

    if (config.userInfoUrl) {
      try {
        const userHeaders: Record<string, string> = {};

        if (platform === 'youtube') {
          userHeaders.Authorization = `Bearer ${accessToken}`;
        } else if (platform === 'instagram') {
          // Instagram은 Facebook 유저 정보 → Instagram 계정 조회
          const fbRes = await fetch(
            `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
          );
          const fbData = await fbRes.json();
          const pageId = fbData.data?.[0]?.id;
          if (pageId) {
            const igRes = await fetch(
              `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account{username}&access_token=${accessToken}`
            );
            const igData = await igRes.json();
            accountName = `@${igData.instagram_business_account?.username || 'instagram_user'}`;
          }
        } else if (platform === 'threads') {
          const threadsRes = await fetch(
            `${config.userInfoUrl}&access_token=${accessToken}`
          );
          const threadsData = await threadsRes.json();
          accountName = `@${threadsData.username || 'threads_user'}`;
        } else if (platform === 'tiktok') {
          const tikRes = await fetch(config.userInfoUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fields: ['display_name', 'username'] }),
          });
          const tikData = await tikRes.json();
          accountName = `@${tikData.data?.user?.username || 'tiktok_user'}`;
        } else if (platform === 'x') {
          const xRes = await fetch(config.userInfoUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const xData = await xRes.json();
          accountName = `@${xData.data?.username || 'x_user'}`;
        }

        // YouTube (일반 Google userinfo)
        if (platform === 'youtube') {
          const gRes = await fetch(config.userInfoUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const gData = await gRes.json();
          accountName = gData.name || '@youtube_user';
        }
      } catch (err) {
        console.error('User info fetch failed:', err);
      }
    }

    // 3. DB에 토큰 저장
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error: dbError } = await supabase
      .from('platforms')
      .update({
        status: 'connected',
        account_name: accountName,
        oauth_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        connected_at: new Date().toISOString(),
      })
      .eq('id', platform);

    if (dbError) {
      console.error('DB update failed:', dbError);
      return redirectAndClearState(`${BASE_URL}/accounts?error=db_error`);
    }

    return redirectAndClearState(`${BASE_URL}/accounts?connected=${platform}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return redirectAndClearState(`${BASE_URL}/accounts?error=callback_failed`);
  }
}
