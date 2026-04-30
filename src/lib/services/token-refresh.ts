import { supabase } from '@/lib/supabase';

export type RefreshablePlatform = 'youtube' | 'tiktok' | 'x' | 'threads' | 'instagram';

interface PlatformTokenRow {
  oauth_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
}

interface RefreshResult {
  accessToken: string;
  refreshToken?: string | null;
  expiresInSec?: number | null;
}

interface RefreshStrategy {
  shouldRefresh: (row: PlatformTokenRow) => boolean;
  refresh: (row: PlatformTokenRow) => Promise<RefreshResult | null>;
}

function expiresWithin(row: PlatformTokenRow, ms: number): boolean {
  if (!row.expires_at) return true;
  const expiresAt = new Date(row.expires_at).getTime();
  return expiresAt - Date.now() < ms;
}

const FIVE_MIN = 5 * 60 * 1000;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const STRATEGIES: Record<RefreshablePlatform, RefreshStrategy> = {
  youtube: {
    shouldRefresh: (row) => Boolean(row.refresh_token) && expiresWithin(row, FIVE_MIN),
    refresh: async (row) => {
      if (!row.refresh_token) return null;
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: row.refresh_token,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      });
      const data = await res.json();
      if (!data.access_token) return null;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? row.refresh_token,
        expiresInSec: data.expires_in ?? 3600,
      };
    },
  },

  tiktok: {
    shouldRefresh: (row) => Boolean(row.refresh_token) && expiresWithin(row, FIVE_MIN),
    refresh: async (row) => {
      if (!row.refresh_token) return null;
      const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: row.refresh_token,
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        }),
      });
      const data = await res.json();
      if (!data.access_token) return null;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? row.refresh_token,
        expiresInSec: data.expires_in ?? null,
      };
    },
  },

  x: {
    shouldRefresh: (row) => Boolean(row.refresh_token) && expiresWithin(row, FIVE_MIN),
    refresh: async (row) => {
      if (!row.refresh_token) return null;
      const res = await fetch('https://api.x.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: row.refresh_token,
          client_id: process.env.X_CLIENT_ID!,
        }),
      });
      const data = await res.json();
      if (!data.access_token) return null;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? row.refresh_token,
        expiresInSec: data.expires_in ?? null,
      };
    },
  },

  threads: {
    // Threads는 60일 장기 토큰 → 7일 이내일 때 연장
    shouldRefresh: (row) => Boolean(row.oauth_token) && expiresWithin(row, SEVEN_DAYS),
    refresh: async (row) => {
      if (!row.oauth_token) return null;
      const res = await fetch(
        `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${row.oauth_token}`
      );
      const data = await res.json();
      if (!data.access_token) return null;
      return {
        accessToken: data.access_token,
        refreshToken: row.refresh_token,
        expiresInSec: data.expires_in ?? 5184000,
      };
    },
  },

  instagram: {
    // Instagram Graph API의 페이지 토큰은 수동 갱신 흐름이 별도라 자동 갱신 미지원
    shouldRefresh: () => false,
    refresh: async () => null,
  },
};

async function readPlatformRow(platform: RefreshablePlatform): Promise<PlatformTokenRow | null> {
  const { data } = await supabase
    .from('platforms')
    .select('oauth_token, refresh_token, expires_at')
    .eq('id', platform)
    .single();
  return (data as PlatformTokenRow | null) ?? null;
}

async function persistRefreshed(platform: RefreshablePlatform, result: RefreshResult) {
  const update: Record<string, unknown> = {
    oauth_token: result.accessToken,
  };
  if (result.refreshToken !== undefined) update.refresh_token = result.refreshToken;
  if (result.expiresInSec) {
    update.expires_at = new Date(Date.now() + result.expiresInSec * 1000).toISOString();
  }
  await supabase.from('platforms').update(update).eq('id', platform);
}

export async function ensureValidToken(platform: RefreshablePlatform): Promise<string> {
  const row = await readPlatformRow(platform);
  if (!row?.oauth_token) {
    throw new Error(`${platform} not connected`);
  }

  const strategy = STRATEGIES[platform];
  if (strategy.shouldRefresh(row)) {
    try {
      const result = await strategy.refresh(row);
      if (result) {
        await persistRefreshed(platform, result);
        return result.accessToken;
      }
    } catch (err) {
      console.error(`[token-refresh] ${platform} refresh failed:`, err);
    }
  }

  return row.oauth_token;
}
