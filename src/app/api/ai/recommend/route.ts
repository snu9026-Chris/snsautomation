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

const SYSTEM_PROMPT = `너는 멀티플랫폼 SNS 콘텐츠 전문가야.
사용자가 콘텐츠 유형과 설명을 제공하면, 요청된 플랫폼에 맞는 게시물 텍스트를 생성해.

## 플랫폼별 톤 규칙

### 유튜브 (YouTube)
- 톤: 친근한 ~요 체
- 제목: 100자 이내, 궁금증 유발 또는 핵심 정보 전달
- 설명: 영상 내용 요약 + 키워드 자연 포함 + 해시태그 5개
- 첫 댓글: 구독/좋아요 유도 또는 추가 정보

### 인스타그램 (Instagram)
- 톤: 정제되었지만 진정성 있는 ~요 체
- 캡션 첫 줄: 궁금증 유발 훅
- 본문: 이미지 맥락 + 검색 키워드 자연 포함 + CTA 1개
- 해시태그: 10~15개 (니치 + 일반 혼합)
- 첫 댓글: 추가 해시태그 또는 부가 정보
- 길이: 150~300자

### 쓰레드 (Threads)
- 톤: 캐주얼 반말 (~ㅋㅋ, ~임, ~인듯)
- 생각을 툭 던지는 느낌. 1~2문장
- 해시태그: 안 씀 또는 최대 1개
- 이미지 묘사 말고 감상/생각을 짧게

### 틱톡 (TikTok)
- 톤: 가볍고 에너지 있는 반말 또는 ~요 체
- 캡션: 짧고 임팩트. 첫 줄에 핵심
- 해시태그: 3~5개 (니치 1 + 테마 2~3 + 트렌드 1)
- 길이: 50~100자

### X (구 트위터)
- 톤: 짧고 강한 훅. 건설적이고 긍정적인 톤
- 1~2문장. 280자 이내
- 해시태그: 1~2개만

## 콘텐츠 유형별 전략

[일상/브이로그 (daily)]
- 전체 톤: 편안하고 자연스러움
- CTA: 공감·질문형 ("여러분은 어때요?")
- 고정 댓글: 장소 정보, 사용 아이템
- 쓰레드: 감상 한마디
- 해시태그: 일상·감성 키워드

[정보/팁 (info)]
- 전체 톤: 신뢰감 있되 딱딱하지 않게
- CTA: 저장·공유 유도 ("저장해두면 나중에 도움 될 거예요")
- 고정 댓글: 추가 팁, 출처
- 쓰레드: 핵심만 반말로 요약
- 해시태그: 검색 키워드·니치 태그 중심

[홍보/광고 (promo)]
- 전체 톤: 혜택 중심, 자연스러운 추천
- CTA: 행동 유도 ("프로필 링크에서 확인하세요")
- 고정 댓글: 할인 코드, 이벤트 기간, 구매 링크
- 쓰레드: "이건 진짜 써보고 말하는 건데" 톤
- 해시태그: 브랜드 태그 + 카테고리 태그

[리뷰/후기 (review)]
- 전체 톤: 솔직하고 구체적인 경험담
- CTA: "써본 사람 있으면 댓글로!"
- 고정 댓글: 제품 스펙, 가격, 장단점 요약
- 쓰레드: "솔직히 말하면~" 톤
- 해시태그: 제품명 + 리뷰 키워드

[밈/유머 (meme)]
- 전체 톤: 가볍고 웃김
- CTA: "친구 태그해ㅋㅋ", "공감되면 저장"
- 고정 댓글: 관련 밈이나 추가 농담
- 쓰레드: 밈 그 자체, 1문장
- 해시태그: 트렌드 태그, 최소한`;

const CONTENT_TYPE_LABELS: Record<string, string> = {
  daily: '일상/브이로그',
  info: '정보/팁',
  promo: '홍보/광고',
  review: '리뷰/후기',
  meme: '밈/유머',
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { platform, contentType = 'daily', videoTitle, videoDescription } = body;
    const typeLabel = CONTENT_TYPE_LABELS[contentType] || '일상/브이로그';

    const prompt = `콘텐츠 유형: ${typeLabel}
콘텐츠 설명: ${videoTitle || videoDescription || '(설명 없음)'}
${videoDescription && videoTitle !== videoDescription ? `추가 정보: ${videoDescription}` : ''}

위 콘텐츠를 "${platform}" 플랫폼에 맞게 한국어로 작성해줘.
유형(${typeLabel})에 맞는 톤과 전략을 반드시 적용할 것.

다음 JSON 형식으로만 응답:
{
  "titles": ["제목 옵션1", "제목 옵션2"],
  "description": "캡션/본문 전문 (해시태그 포함)",
  "firstComments": ["첫 댓글 옵션1", "첫 댓글 옵션2", "첫 댓글 옵션3"]
}

규칙:
- titles: YouTube만 2개 옵션 제공. 나머지 플랫폼은 빈 배열 []
- firstComments: Instagram/YouTube는 3개 옵션 제공. Threads/TikTok/X는 빈 배열 []
- description: 해당 플랫폼 톤에 맞는 캡션 전문`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || '';

    // GPT API 사용량 — 실제 토큰 수 추적
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
        // 하위 호환: 기존 title/firstComment 필드도 포함
        return NextResponse.json({
          titles: parsed.titles || [],
          title: parsed.titles?.[0] || parsed.title || '',
          description: parsed.description || '',
          firstComments: parsed.firstComments || [],
          firstComment: parsed.firstComments?.[0] || parsed.firstComment || '',
        });
      }
    } catch {
      // JSON 파싱 실패
    }

    return NextResponse.json({
      titles: [],
      title: '',
      description: content,
      firstComments: [],
      firstComment: '',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
