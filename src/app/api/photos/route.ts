import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ensureValidToken } from '@/lib/services/token-refresh';
import { supabase } from '@/lib/supabase';

async function getGoogleToken() {
  try {
    return await ensureValidToken('youtube');
  } catch {
    throw new Error('YouTube/Google이 연결되지 않았습니다. 먼저 YouTube 계정을 연결하세요.');
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { action, sessionId, baseUrl, fileName, mimeType } = body;
    const token = await getGoogleToken();

    // 1. Google Photos Picker 세션 생성
    if (action === 'create-session') {
      const res = await fetch('https://photospicker.googleapis.com/v1/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `세션 생성 실패: ${err}` }, { status: res.status });
      }

      return NextResponse.json(await res.json());
    }

    // 2. 세션 폴링 (사용자가 사진 선택했는지 확인)
    if (action === 'poll-session') {
      const res = await fetch(
        `https://photospicker.googleapis.com/v1/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) return NextResponse.json({ error: '폴링 실패' }, { status: res.status });
      return NextResponse.json(await res.json());
    }

    // 3. 선택된 미디어 아이템 조회
    if (action === 'get-media') {
      const res = await fetch(
        `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}&pageSize=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) return NextResponse.json({ error: '미디어 조회 실패' }, { status: res.status });
      return NextResponse.json(await res.json());
    }

    // 4. 사진 다운로드 → Supabase Storage 업로드
    if (action === 'download') {
      const imgRes = await fetch(`${baseUrl}=d`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!imgRes.ok) return NextResponse.json({ error: '다운로드 실패' }, { status: imgRes.status });

      const blob = await imgRes.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());

      const timestamp = Date.now();
      const storagePath = `uploads/${timestamp}_${fileName || 'photo.jpg'}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, buffer, {
          contentType: mimeType || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath);
      return NextResponse.json({ url: urlData.publicUrl, path: storagePath });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
