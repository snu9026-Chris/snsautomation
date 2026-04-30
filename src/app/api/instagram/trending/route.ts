import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GRAPH_API = 'https://graph.facebook.com/v21.0';

// 기본 추천 해시태그 (카테고리별)
const HASHTAG_CATEGORIES: Record<string, string[]> = {
  '전체': ['숏폼', '릴스', '트렌드'],
  '일상': ['일상브이로그', '데일리', 'daily'],
  '음식': ['맛집', '먹방', 'foodie'],
  '뷰티': ['뷰티', '메이크업', 'beauty'],
  '패션': ['패션', 'ootd', '코디'],
  '여행': ['여행', '여행스타그램', 'travel'],
  '운동': ['운동', '헬스', 'fitness'],
  '반려동물': ['강아지', '고양이', 'pet'],
};

export async function GET(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || '전체';
  const customTag = searchParams.get('hashtag'); // 사용자 직접 입력

  // 1. Instagram 연결 상태 확인 (DB에서 토큰 조회)
  const { data: platform } = await supabase
    .from('platforms')
    .select('oauth_token, account_name')
    .eq('id', 'instagram')
    .single();

  if (!platform?.oauth_token) {
    return NextResponse.json(
      { error: 'Instagram 계정을 먼저 연결해주세요.', needsAuth: true },
      { status: 401 }
    );
  }

  const accessToken = platform.oauth_token;

  // 2. Instagram Business Account ID 가져오기
  try {
    // Facebook Pages → Instagram Business Account
    const pagesRes = await fetch(
      `${GRAPH_API}/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      return NextResponse.json({ error: pagesData.error.message }, { status: 400 });
    }

    const pageId = pagesData.data?.[0]?.id;
    if (!pageId) {
      return NextResponse.json(
        { error: 'Facebook 페이지를 찾을 수 없습니다. 페이지와 Instagram 계정을 연결해주세요.' },
        { status: 400 }
      );
    }

    // Page → Instagram Business Account ID
    const igRes = await fetch(
      `${GRAPH_API}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
    );
    const igData = await igRes.json();
    const igAccountId = igData.instagram_business_account?.id;

    if (!igAccountId) {
      return NextResponse.json(
        { error: 'Instagram 비즈니스 계정을 찾을 수 없습니다. Instagram 계정을 비즈니스/크리에이터로 전환하고 Facebook 페이지에 연결해주세요.' },
        { status: 400 }
      );
    }

    // 3. 해시태그별 인기 게시물 조회
    const hashtags = customTag ? [customTag] : (HASHTAG_CATEGORIES[category] || HASHTAG_CATEGORIES['전체']);
    const allPosts: Record<string, unknown>[] = [];

    for (const tag of hashtags) {
      try {
        // 해시태그 ID 검색
        const hashRes = await fetch(
          `${GRAPH_API}/ig_hashtag_search?q=${encodeURIComponent(tag)}&user_id=${igAccountId}&access_token=${accessToken}`
        );
        const hashData = await hashRes.json();
        const hashtagId = hashData.data?.[0]?.id;

        if (!hashtagId) continue;

        // 인기 게시물 조회
        const topRes = await fetch(
          `${GRAPH_API}/${hashtagId}/top_media?user_id=${igAccountId}&fields=id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp&access_token=${accessToken}`
        );
        const topData = await topRes.json();

        if (topData.data) {
          for (const post of topData.data) {
            allPosts.push({
              id: post.id,
              caption: post.caption || '',
              mediaType: post.media_type, // IMAGE, VIDEO, CAROUSEL_ALBUM
              mediaUrl: post.media_url || '',
              permalink: post.permalink,
              likeCount: post.like_count || 0,
              commentsCount: post.comments_count || 0,
              timestamp: post.timestamp,
              hashtag: tag,
            });
          }
        }
      } catch {
        console.error(`Failed to fetch hashtag: ${tag}`);
      }
    }

    // 좋아요 수 기준 정렬, 상위 20개
    allPosts.sort((a, b) => (b.likeCount as number) - (a.likeCount as number));
    const top = allPosts.slice(0, 20);

    return NextResponse.json({
      posts: top,
      hashtags,
      category,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
