import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// PUT — 예약 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    const body = await request.json();
    const { platforms, platformData, scheduledAt, mediaUrls, mediaType, status } = body;

    // status 변경만 하는 경우 (수동 발행 완료 등)
    if (status && !platforms && !platformData) {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ status })
        .eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // status가 scheduled인 것만 수정 가능
    const { data: existing } = await supabase
      .from('scheduled_posts')
      .select('status, post_id')
      .eq('id', id)
      .single();

    if (!existing || existing.status !== 'scheduled') {
      return NextResponse.json({ error: '수정할 수 없는 상태입니다.' }, { status: 400 });
    }

    // posts 테이블 업데이트
    if (platformData || mediaUrls) {
      const mainPlatform = platforms?.[0];
      const mainData = platformData?.[mainPlatform];
      const postUpdate: Record<string, unknown> = {};
      if (mainData?.title) postUpdate.title = mainData.title;
      if (mainData?.description) postUpdate.description = mainData.description;
      if (mainData?.firstComment) postUpdate.first_comment = mainData.firstComment;
      if (mediaUrls) postUpdate.media_urls = mediaUrls;
      if (mediaType) postUpdate.media_type = mediaType;

      if (Object.keys(postUpdate).length > 0) {
        await supabase.from('posts').update(postUpdate).eq('id', existing.post_id);
      }
    }

    // scheduled_posts 업데이트
    const schedUpdate: Record<string, unknown> = {};
    if (platforms) schedUpdate.platforms = platforms;
    if (platformData) schedUpdate.platform_data = platformData;
    if (scheduledAt) schedUpdate.scheduled_at = scheduledAt;
    if (mediaType) schedUpdate.media_type = mediaType;

    const { error } = await supabase
      .from('scheduled_posts')
      .update(schedUpdate)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — 예약 취소 (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    const { error } = await supabase
      .from('scheduled_posts')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('status', 'scheduled');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
