import { ensureValidToken } from '@/lib/services/token-refresh';

interface TikTokOptions {
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY';
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
  brandContentToggle?: boolean;
  brandOrganicToggle?: boolean;
}

interface TikTokPublishParams {
  mediaUrl: string;
  title: string;
  tiktokOptions?: TikTokOptions;
}

export async function publishToTikTok(params: TikTokPublishParams) {
  const { mediaUrl, title, tiktokOptions } = params;
  const opts = tiktokOptions || {};
  const accessToken = await ensureValidToken('tiktok');

  // Step 1: 영상 파일 다운로드
  const videoRes = await fetch(mediaUrl);
  if (!videoRes.ok) throw new Error('Failed to fetch video file');
  const videoBuffer = await videoRes.arrayBuffer();
  const videoSize = videoBuffer.byteLength;

  // Step 2: Direct post — 업로드 초기화
  const initRes = await fetch(
    'https://open.tiktokapis.com/v2/post/publish/video/init/',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title,
          privacy_level: opts.privacyLevel || 'PUBLIC_TO_EVERYONE',
          disable_comment: opts.disableComment ?? false,
          disable_duet: opts.disableDuet ?? false,
          disable_stitch: opts.disableStitch ?? false,
          brand_content_toggle: opts.brandContentToggle ?? false,
          brand_organic_toggle: opts.brandOrganicToggle ?? false,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1,
        },
      }),
    }
  );

  const initData = await initRes.json();

  if (initData.error?.code) {
    throw new Error(`TikTok init error: ${initData.error.message}`);
  }

  const uploadUrl = initData.data?.upload_url;
  const publishId = initData.data?.publish_id;

  if (!uploadUrl) throw new Error('No TikTok upload URL returned');

  // Step 3: 영상 업로드
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    throw new Error(`TikTok upload failed: ${uploadRes.statusText}`);
  }

  // Step 4: 발행 상태 확인 (polling)
  let status = 'PROCESSING';
  let attempts = 0;
  while (status === 'PROCESSING' && attempts < 30) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publish_id: publishId }),
      }
    );
    const statusData = await statusRes.json();
    status = statusData.data?.status || 'FAILED';
    attempts++;
  }

  return {
    platformPostId: publishId,
    platformPostUrl: 'https://www.tiktok.com', // TikTok API doesn't return direct URL
  };
}
