import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 일단위 할당량 리셋 (Vercel Cron에서 호출)
// YouTube, Instagram, Threads, TikTok은 일단위 리셋
// X는 월단위라 매월 1일에만 리셋
export async function GET(request: Request) {
  // Cron 인증 (Vercel Cron에서 호출 시 CRON_SECRET 검증)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const isFirstOfMonth = now.getDate() === 1;

  // 일단위 리셋: YouTube, Instagram, Threads, TikTok
  const dailyPlatforms = ['youtube', 'instagram', 'threads', 'tiktok'];
  const { error: dailyError } = await supabase
    .from('platforms')
    .update({ quota_used: 0 })
    .in('id', dailyPlatforms);

  // 월단위 리셋: X (매월 1일)
  let monthlyReset = false;
  if (isFirstOfMonth) {
    const { error: monthlyError } = await supabase
      .from('platforms')
      .update({ quota_used: 0 })
      .eq('id', 'x');
    monthlyReset = !monthlyError;
  }

  return NextResponse.json({
    dailyReset: !dailyError,
    monthlyReset,
    resetAt: now.toISOString(),
    platforms: dailyPlatforms.concat(isFirstOfMonth ? ['x'] : []),
  });
}
