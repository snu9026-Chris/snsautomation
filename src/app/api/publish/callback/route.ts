import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// n8n에서 각 플랫폼 발행 결과를 보내주는 콜백
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, platform, status, platformPostUrl, errorMessage } = body;

    const { error } = await supabase
      .from('publish_logs')
      .update({
        status: status || 'failed',
        platform_post_url: platformPostUrl || null,
        error_message: errorMessage || null,
        published_at: new Date().toISOString(),
      })
      .eq('post_id', postId)
      .eq('platform', platform);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
