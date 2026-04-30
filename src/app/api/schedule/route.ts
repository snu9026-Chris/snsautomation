import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST — 예약 생성
export async function POST(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { platforms, mediaUrls, mediaType, platformData, scheduledAt } = body;

    if (!platforms?.length || !scheduledAt) {
      return NextResponse.json({ error: 'platforms와 scheduledAt은 필수입니다.' }, { status: 400 });
    }

    // 1. posts 테이블에 원본 콘텐츠 저장
    const mainPlatform = platforms[0];
    const mainData = platformData[mainPlatform];

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title: mainData?.title || '',
        description: mainData?.description || '',
        first_comment: mainData?.firstComment || '',
        media_urls: mediaUrls || [],
        media_type: mediaType || 'image',
      })
      .select('id')
      .single();

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }

    // 2. scheduled_posts 테이블에 예약 저장
    const { data: scheduled, error: schedError } = await supabase
      .from('scheduled_posts')
      .insert({
        post_id: post.id,
        scheduled_at: scheduledAt,
        platforms,
        platform_data: platformData,
        media_type: mediaType || 'image',
        status: 'scheduled',
      })
      .select('id')
      .single();

    if (schedError) {
      return NextResponse.json({ error: schedError.message }, { status: 500 });
    }

    return NextResponse.json({ id: scheduled.id, postId: post.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — 월별 예약 조회
export async function GET(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get('month') || new Date().getMonth() + 1);
    const year = Number(searchParams.get('year') || new Date().getFullYear());

    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('scheduled_posts')
      .select(`
        id,
        post_id,
        scheduled_at,
        status,
        platforms,
        platform_data,
        media_type,
        created_at,
        posts (
          id,
          title,
          description,
          media_urls,
          media_type
        )
      `)
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate)
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const posts = (data || []).map((row: Record<string, unknown>) => {
      const post = row.posts as Record<string, unknown> | null;
      return {
        id: row.id,
        postId: row.post_id,
        scheduledAt: row.scheduled_at,
        status: row.status,
        platforms: row.platforms || [],
        platformData: row.platform_data || {},
        mediaUrls: post?.media_urls || [],
        mediaType: row.media_type || post?.media_type || 'image',
        createdAt: row.created_at,
      };
    });

    return NextResponse.json(posts);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
