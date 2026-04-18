import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SYSTEM_PROMPT = `너는 숏폼 영상 자막 전문가야.
사용자가 영상 주제와 이미지 설명을 제공하면, 해당 장면에 어울리는 짧은 자막을 만들어.

## 자막 규칙
- 1줄 권장, 최대 2줄 (총 30자 이내)
- 이미지 위에 오버레이되므로 짧고 강렬하게
- 해시태그, URL, 이모지 넣지 않기
- 3개 옵션 제공 (톤을 각각 다르게)

## 콘텐츠 유형별 자막 톤

[일상/브이로그 (daily)]
- 감성적이고 자연스러운 독백체
- 예: "이런 날이 좋다", "여기가 그 카페야"

[정보/팁 (info)]
- 핵심 정보를 짧게 전달
- 예: "이거 모르면 손해", "꿀팁 하나 알려줄게"

[홍보/광고 (promo)]
- 제품/서비스 혜택 중심
- 예: "이게 이 가격이라고?", "써보면 알게 됨"

[리뷰/후기 (review)]
- 솔직한 사용 경험
- 예: "3주 써본 솔직 후기", "결론부터 말하면..."

[밈/유머 (meme)]
- 웃기고 공감되는 한 줄
- 예: "나만 이래?", "이건 참을 수 없지"`;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { imageDescription, contentType = 'daily' } = body;

    const CONTENT_LABELS: Record<string, string> = {
      daily: '일상/브이로그', info: '정보/팁', promo: '홍보/광고',
      review: '리뷰/후기', meme: '밈/유머',
    };
    const typeLabel = CONTENT_LABELS[contentType] || '일상/브이로그';

    const prompt = `콘텐츠 유형: ${typeLabel}
영상 주제 / 장면 설명: ${imageDescription || '(설명 없음)'}

이 장면에 오버레이할 숏폼 자막 3개를 만들어줘.
유형(${typeLabel})에 맞는 톤을 반드시 적용할 것.

다음 JSON 형식으로만 응답:
{ "captions": ["자막1", "자막2", "자막3"] }`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content || '';

    const tokensUsed = completion.usage?.total_tokens || 0;
    if (tokensUsed > 0) {
      const { data: usage } = await supabase.from('api_usage').select('quota_used').eq('platform', 'gpt').single();
      if (usage) {
        await supabase.from('api_usage').update({ quota_used: (usage.quota_used || 0) + tokensUsed }).eq('platform', 'gpt');
      }
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ captions: parsed.captions || [] });
      }
    } catch {
      // JSON parse failed
    }

    return NextResponse.json({ captions: [content.trim()] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
