import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface YouTubePublishParams {
  mediaUrl: string;
  title: string;
  description: string;
  categoryId?: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
  firstComment?: string;
}

async function getYouTubeToken() {
  const { data } = await supabase
    .from('platforms')
    .select('oauth_token, refresh_token')
    .eq('id', 'youtube')
    .single();

  if (!data?.oauth_token) throw new Error('YouTube not connected');

  // Google access token은 1시간 만료 → refresh token으로 갱신
  if (data.refresh_token) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: data.refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    });
    const refreshData = await refreshRes.json();

    if (refreshData.access_token) {
      // DB에 새 토큰 저장
      await supabase
        .from('platforms')
        .update({ oauth_token: refreshData.access_token })
        .eq('id', 'youtube');
      return refreshData.access_token;
    }
  }

  return data.oauth_token;
}

export async function publishToYouTube(params: YouTubePublishParams) {
  const { mediaUrl, title, description, categoryId = '22', privacyStatus = 'public', firstComment } = params;
  const accessToken = await getYouTubeToken();

  // Step 1: 영상 파일 다운로드
  const videoRes = await fetch(mediaUrl);
  if (!videoRes.ok) throw new Error('Failed to fetch video file');
  const videoBlob = await videoRes.blob();

  // Step 2: Resumable upload 시작
  const metadata = {
    snippet: {
      title,
      description,
      categoryId,
    },
    status: {
      privacyStatus,
    },
  };

  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': videoBlob.type || 'video/mp4',
        'X-Upload-Content-Length': String(videoBlob.size),
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.json();
    throw new Error(`YouTube upload init failed: ${err.error?.message || initRes.statusText}`);
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) throw new Error('No upload URL returned');

  // Step 3: 실제 파일 업로드
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': videoBlob.type || 'video/mp4',
      'Content-Length': String(videoBlob.size),
    },
    body: videoBlob,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(`YouTube upload failed: ${err.error?.message || uploadRes.statusText}`);
  }

  const uploadData = await uploadRes.json();
  const videoId = uploadData.id;

  // Step 4: 첫 댓글 작성 + 고정
  if (firstComment && videoId) {
    try {
      const commentRes = await fetch(
        'https://www.googleapis.com/youtube/v3/commentThreads?part=snippet',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              videoId,
              topLevelComment: {
                snippet: { textOriginal: firstComment },
              },
            },
          }),
        }
      );
      if (!commentRes.ok) {
        console.error('YouTube comment failed:', await commentRes.text());
      }
      // 참고: YouTube Data API v3에는 댓글 고정 기능이 없음 (YouTube Studio에서만 가능)
    } catch (err) {
      console.error('YouTube first comment failed:', err);
    }
  }

  return {
    platformPostId: videoId,
    platformPostUrl: `https://youtu.be/${videoId}`,
  };
}
