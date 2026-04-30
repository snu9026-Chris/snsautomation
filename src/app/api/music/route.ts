import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const ACE_API_BASE = 'https://api.acemusic.ai';

// POST — 음원 생성 또는 상태 확인
export async function POST(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const apiKey = process.env.ACE_MUSIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ACE_MUSIC_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // 1. 음원 생성 요청
    if (action === 'generate') {
      const { prompt, lyrics, duration, instrumental } = body;

      const res = await fetch(`${ACE_API_BASE}/release_task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: prompt || '',
          lyrics: instrumental ? '[Instrumental]' : (lyrics || ''),
          audio_duration: duration || 30,
          audio_format: 'mp3',
          batch_size: 1,
          thinking: true,
          use_format: true,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `생성 요청 실패: ${err}` }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    // 2. 생성 상태 확인
    if (action === 'check') {
      const { taskId } = body;

      const res = await fetch(`${ACE_API_BASE}/query_result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          task_id_list: [taskId],
        }),
      });

      if (!res.ok) {
        return NextResponse.json({ error: '상태 확인 실패' }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
