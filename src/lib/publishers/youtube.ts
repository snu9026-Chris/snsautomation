import { ensureValidToken } from '@/lib/services/token-refresh';

interface YouTubePublishParams {
  mediaUrl: string;
  title: string;
  description: string;
  categoryId?: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
  firstComment?: string;
}

export async function publishToYouTube(params: YouTubePublishParams) {
  const { mediaUrl, title, description, categoryId = '22', privacyStatus = 'public', firstComment } = params;
  const accessToken = await ensureValidToken('youtube');

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
