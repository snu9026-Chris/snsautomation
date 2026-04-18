import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { publishToPlatform } from '@/lib/publishers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platforms, mediaUrls, mediaType, platformData } = body;

    // 1. posts 테이블에 원본 콘텐츠 저장
    const mainPlatform = platforms[0];
    const mainData = platformData[mainPlatform];

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title: mainData?.title || '',
        description: mainData?.description || '',
        first_comment: mainData?.firstComment || '',
        media_urls: mediaUrls,
        media_type: mediaType,
      })
      .select('id')
      .single();

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }

    // 2. 각 플랫폼별 publish_logs를 pending으로 생성
    const logInserts = platforms.map((pid: string) => ({
      post_id: post.id,
      platform: pid,
      status: 'pending',
      platform_data: platformData[pid] || {},
    }));

    const { error: logError } = await supabase
      .from('publish_logs')
      .insert(logInserts);

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    // 3. 각 플랫폼에 직접 발행
    const results = await Promise.allSettled(
      platforms.map(async (pid: string) => {
        const pData = platformData[pid] || {};
        const result = await publishToPlatform({
          platform: pid,
          mediaUrl: mediaUrls[0],
          mediaType,
          title: pData.title,
          description: pData.description,
          firstComment: pData.firstComment,
          instagramFormat: pData.instagramFormat,
          tiktokOptions: pData.tiktokOptions,
        } as Parameters<typeof publishToPlatform>[0] & { instagramFormat?: string; tiktokOptions?: Record<string, unknown> });

        // DB 업데이트
        await supabase
          .from('publish_logs')
          .update({
            status: result.status,
            platform_post_url: result.platformPostUrl || null,
            error_message: result.errorMessage || null,
            published_at: new Date().toISOString(),
          })
          .eq('post_id', post.id)
          .eq('platform', pid);

        // 발행 성공 시 API 사용량 증가
        if (result.status === 'success') {
          const cost = pid === 'youtube' ? 1600 : 1; // YouTube 업로드 1회 = 1,600 quota units
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

    const publishResults = results.map((r) =>
      r.status === 'fulfilled' ? r.value : { status: 'failed', errorMessage: 'Unexpected error' }
    );

    return NextResponse.json({
      postId: post.id,
      results: publishResults,
      message: `${platforms.length}개 플랫폼에 발행 요청 완료`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
