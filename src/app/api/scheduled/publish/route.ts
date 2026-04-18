import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { publishToPlatform } from '@/lib/publishers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Vercel Cron — 매일 예약된 콘텐츠 자동 발행
export async function GET(request: Request) {
  // Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  // 오늘 이전 + status=scheduled인 예약 조회
  const { data: scheduledPosts, error: fetchError } = await supabase
    .from('scheduled_posts')
    .select(`
      id,
      post_id,
      platforms,
      platform_data,
      media_type,
      posts (
        media_urls,
        media_type
      )
    `)
    .lte('scheduled_at', now)
    .eq('status', 'scheduled');

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!scheduledPosts || scheduledPosts.length === 0) {
    return NextResponse.json({ message: '발행할 예약이 없습니다.', published: 0 });
  }

  let publishedCount = 0;
  let failedCount = 0;

  for (const scheduled of scheduledPosts) {
    const post = scheduled.posts as unknown as Record<string, unknown> | null;
    const mediaUrls = (post?.media_urls || []) as string[];
    const mediaType = scheduled.media_type || (post?.media_type as string) || 'image';
    const platforms = (scheduled.platforms || []) as string[];
    const platformData = (scheduled.platform_data || {}) as Record<string, Record<string, unknown>>;

    // 1. publish_logs 생성 (pending)
    const logInserts = platforms.map((pid: string) => ({
      post_id: scheduled.post_id,
      platform: pid,
      status: 'pending',
      platform_data: platformData[pid] || {},
    }));

    await supabase.from('publish_logs').insert(logInserts);

    // 2. 각 플랫폼에 발행
    const results = await Promise.allSettled(
      platforms.map(async (pid: string) => {
        const pData = platformData[pid] || {};
        const result = await publishToPlatform({
          platform: pid,
          mediaUrl: mediaUrls[0] || '',
          mediaType,
          title: pData.title as string || '',
          description: pData.description as string || '',
          firstComment: pData.firstComment as string || '',
          instagramFormat: pData.instagramFormat,
          tiktokOptions: pData.tiktokOptions,
        } as Parameters<typeof publishToPlatform>[0] & { instagramFormat?: unknown; tiktokOptions?: unknown });

        // publish_logs 업데이트
        await supabase
          .from('publish_logs')
          .update({
            status: result.status,
            platform_post_url: result.platformPostUrl || null,
            error_message: result.errorMessage || null,
            published_at: new Date().toISOString(),
          })
          .eq('post_id', scheduled.post_id)
          .eq('platform', pid);

        // API 사용량 증가
        if (result.status === 'success') {
          const cost = pid === 'youtube' ? 1600 : 1;
          const { data: usage } = await supabase
            .from('api_usage')
            .select('quota_used')
            .eq('platform', pid)
            .single();
          if (usage) {
            await supabase
              .from('api_usage')
              .update({ quota_used: (usage.quota_used || 0) + cost })
              .eq('platform', pid);
          }
        }

        return result;
      })
    );

    // 3. scheduled_posts 상태 업데이트
    const allFailed = results.every(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'failed')
    );

    await supabase
      .from('scheduled_posts')
      .update({ status: allFailed ? 'failed' : 'published' })
      .eq('id', scheduled.id);

    if (allFailed) failedCount++;
    else publishedCount++;
  }

  return NextResponse.json({
    message: `${publishedCount}개 발행 완료, ${failedCount}개 실패`,
    published: publishedCount,
    failed: failedCount,
  });
}
