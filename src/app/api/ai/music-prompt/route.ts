import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SYSTEM_PROMPT = `너는 AI 음악 생성 프롬프트 전문가야.
사용자가 영상 주제를 설명하면, **Suno AI / ACE-Step 형식**에 맞는 음악 프롬프트와 가사를 만들어.

## Suno AI 스타일 프롬프트 규칙
- prompt: 영어로 작성. Suno AI에서 바로 사용 가능한 형식.
  - 구성: [장르], [서브장르], [분위기/감정], [악기], [보컬 스타일], [BPM], [기타 특성]
  - 예: "lo-fi chill hop, mellow, warm piano, vinyl crackle, soft pads, 82 BPM, relaxing study music"
  - 예: "cinematic orchestral, epic, strings and brass, dramatic build-up, 120 BPM, trailer music"
  - 예: "acoustic folk, warm, fingerpicked guitar, gentle vocals, campfire vibes, 95 BPM"
- lyrics: **반드시 생성**. 한국어로 작성. Suno 형식의 구조 태그 사용:
  - [Intro], [Verse], [Pre-Chorus], [Chorus], [Bridge], [Outro], [Instrumental Break]
  - 악기만(instrumental) 옵션이면 "[Instrumental]"만.
  - 보컬이 있으면 최소 [Verse] 1개 + [Chorus] 1개 이상의 가사를 작성할 것.
- 3개 옵션 제공 (분위기를 감성/에너지/분위기별로 다르게)
- mood: 한국어 한 줄로 분위기 요약 (UI 버튼 라벨용)

## 예시
{
  "prompt": "lo-fi chill hip hop, mellow piano, soft drums, vinyl crackle, warm pads, 82 BPM, study music",
  "lyrics": "[Instrumental]",
  "mood": "잔잔한 로파이"
}
{
  "prompt": "K-pop dance pop, bright synth, punchy bass, catchy hook, female vocal, 128 BPM, energetic",
  "lyrics": "[Verse]\\n오늘도 빛나는 하루\\n멈추지 않을 거야\\n[Chorus]\\n달려가자 더 높이\\n우리만의 세상으로",
  "mood": "밝은 K-pop"
}`;

export async function POST(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { videoDescription, contentType = 'daily', instrumental = false, duration = 30 } = body;

    const prompt = `음악 설명: ${videoDescription || '(설명 없음)'}
콘텐츠 유형: ${contentType}
악기만 (보컬 없음): ${instrumental ? '예' : '아니오'}
음원 길이: ${duration}초

위 설명에 맞는 배경 음악 프롬프트 3개를 만들어줘.
${!instrumental ? `가사는 ${duration}초 길이에 맞게 적절한 분량으로 작성할 것. ${duration <= 30 ? '[Verse] 1개 + [Chorus] 1개 정도' : duration <= 60 ? '[Verse] 1개 + [Chorus] 1개 + [Verse] 1개' : '[Intro] + [Verse] 2개 + [Chorus] 2개 + [Outro]'}.` : ''}

JSON 형식으로만 응답:
{
  "options": [
    { "prompt": "영어 음악 설명", "lyrics": "가사 또는 [Instrumental]", "mood": "분위기 한마디 (한국어)" }
  ]
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1200,
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
        return NextResponse.json({ options: parsed.options || [] });
      }
    } catch { /* JSON parse failed */ }

    return NextResponse.json({ options: [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
