import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = 'media';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 고유 파일명 생성
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `uploads/${timestamp}_${safeName}`;

    // Supabase Storage에 업로드
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // 버킷이 없으면 자동 생성 시도
      if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
        await supabase.storage.createBucket(BUCKET, {
          public: true,
          fileSizeLimit: 500 * 1024 * 1024, // 500MB
        });

        // 재시도
        const { error: retryError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
