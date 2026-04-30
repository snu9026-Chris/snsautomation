import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/videos';
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const CATEGORY_MAP: Record<string, string> = {
  '음악': '10',
  '게임': '20',
  '엔터테인먼트': '24',
  '스포츠': '17',
  '뉴스': '25',
  '교육': '27',
  '과학기술': '28',
  '여행': '19',
  '음식': '26',
};

// mostPopular 차트가 KR 리전에서 지원되지 않는 카테고리 → search API로 대체
const SEARCH_QUERY_MAP: Record<string, string> = {
  '여행': '여행 브이로그',
  '교육': '교육 강의',
};

function mapVideoItem(item: Record<string, unknown>, category: string) {
  const snippet = item.snippet as Record<string, unknown>;
  const stats = item.statistics as Record<string, string> | undefined;
  const thumbnails = snippet.thumbnails as Record<string, { url: string }>;

  return {
    id: item.id,
    videoId: item.id,
    title: snippet.title,
    channelName: snippet.channelTitle,
    thumbnailUrl: thumbnails?.high?.url || thumbnails?.medium?.url || '',
    viewCount: parseInt(stats?.viewCount || '0', 10),
    category,
    publishedAt: snippet.publishedAt,
  };
}

async function fetchViaSearch(category: string) {
  const query = SEARCH_QUERY_MAP[category];
  if (!query) return null;

  const searchParams = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    regionCode: 'KR',
    order: 'viewCount',
    maxResults: '20',
    key: YOUTUBE_API_KEY!,
  });

  const searchRes = await fetch(`${YOUTUBE_SEARCH_URL}?${searchParams}`, { next: { revalidate: 3600 } });
  const searchData = await searchRes.json();
  if (searchData.error || !searchData.items?.length) return null;

  // search API는 statistics를 안 줌 → video ID로 다시 조회
  const videoIds = searchData.items
    .map((item: Record<string, unknown>) => (item.id as Record<string, string>)?.videoId)
    .filter(Boolean)
    .join(',');

  const detailParams = new URLSearchParams({
    part: 'snippet,statistics',
    id: videoIds,
    key: YOUTUBE_API_KEY!,
  });

  const detailRes = await fetch(`${YOUTUBE_API_URL}?${detailParams}`, { next: { revalidate: 3600 } });
  const detailData = await detailRes.json();
  if (detailData.error) return null;

  return (detailData.items ?? []).map((item: Record<string, unknown>) => mapVideoItem(item, category));
}

export async function GET(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || '전체';

  // mostPopular 미지원 카테고리 → search API로 대체
  if (SEARCH_QUERY_MAP[category]) {
    try {
      const videos = await fetchViaSearch(category);
      if (videos) return NextResponse.json({ videos });
      return NextResponse.json({ videos: [] });
    } catch {
      return NextResponse.json({ error: '데이터를 불러오지 못했습니다.' }, { status: 500 });
    }
  }

  const params = new URLSearchParams({
    part: 'snippet,statistics',
    chart: 'mostPopular',
    regionCode: 'KR',
    maxResults: '20',
    key: YOUTUBE_API_KEY,
  });

  if (category !== '전체' && CATEGORY_MAP[category]) {
    params.set('videoCategoryId', CATEGORY_MAP[category]);
  }

  try {
    const res = await fetch(`${YOUTUBE_API_URL}?${params}`, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (data.error) {
      // 다른 카테고리도 mostPopular 미지원이면 search로 fallback
      if (data.error.code === 404 && category !== '전체') {
        SEARCH_QUERY_MAP[category] = category;
        const videos = await fetchViaSearch(category);
        if (videos) return NextResponse.json({ videos });
      }
      return NextResponse.json({ error: data.error.message }, { status: data.error.code });
    }

    const videos = (data.items ?? []).map((item: Record<string, unknown>) => mapVideoItem(item, category));

    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch YouTube data' }, { status: 500 });
  }
}
