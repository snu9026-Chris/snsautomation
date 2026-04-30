import { ensureValidToken } from '@/lib/services/token-refresh';

interface XPublishParams {
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  firstComment?: string;
}

async function uploadMediaToX(accessToken: string, mediaUrl: string, mediaType: string) {
  // X v1.1 media upload (chunked for video)
  const mediaRes = await fetch(mediaUrl);
  if (!mediaRes.ok) throw new Error('Failed to fetch media file');
  const mediaBuffer = Buffer.from(await mediaRes.arrayBuffer());
  const totalBytes = mediaBuffer.length;

  const mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';

  // INIT
  const initRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      command: 'INIT',
      total_bytes: String(totalBytes),
      media_type: mimeType,
      media_category: mediaType === 'video' ? 'tweet_video' : 'tweet_image',
    }),
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`X media INIT failed (${initRes.status}): ${errText}`);
  }

  const initData = await initRes.json();
  const mediaId = initData.media_id_string;

  if (!mediaId) throw new Error('X media upload INIT failed: no media_id');

  // APPEND (chunk upload via form-urlencoded with base64)
  const chunkSize = 5 * 1024 * 1024;
  let segmentIndex = 0;
  for (let offset = 0; offset < totalBytes; offset += chunkSize) {
    const chunk = mediaBuffer.subarray(offset, Math.min(offset + chunkSize, totalBytes));

    const appendRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        command: 'APPEND',
        media_id: mediaId,
        segment_index: String(segmentIndex),
        media_data: chunk.toString('base64'),
      }),
    });

    if (!appendRes.ok) {
      const errText = await appendRes.text();
      throw new Error(`X media APPEND failed (${appendRes.status}): ${errText}`);
    }
    segmentIndex++;
  }

  // FINALIZE
  const finalRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      command: 'FINALIZE',
      media_id: mediaId,
    }),
  });

  if (!finalRes.ok) {
    const errText = await finalRes.text();
    throw new Error(`X media FINALIZE failed (${finalRes.status}): ${errText}`);
  }

  const finalData = await finalRes.json();

  // 동영상은 처리 대기
  if (finalData.processing_info) {
    let state = finalData.processing_info.state;
    while (state === 'pending' || state === 'in_progress') {
      const waitSecs = finalData.processing_info.check_after_secs || 5;
      await new Promise((r) => setTimeout(r, waitSecs * 1000));
      const statusRes = await fetch(
        `https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const statusData = await statusRes.json();
      state = statusData.processing_info?.state;
    }
  }

  return mediaId;
}

export async function publishToX(params: XPublishParams) {
  const { text, mediaUrl, mediaType, firstComment } = params;
  const accessToken = await ensureValidToken('x');

  const tweetBody: Record<string, unknown> = { text };

  // 미디어가 있으면 먼저 업로드
  if (mediaUrl && mediaType) {
    const mediaId = await uploadMediaToX(accessToken, mediaUrl, mediaType);
    tweetBody.media = { media_ids: [mediaId] };
  }

  // 트윗 생성
  const tweetRes = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tweetBody),
  });

  const tweetData = await tweetRes.json();

  if (tweetData.errors || !tweetData.data?.id) {
    throw new Error(`X post failed: ${JSON.stringify(tweetData.errors || tweetData)}`);
  }

  const tweetId = tweetData.data.id;

  // 첫 댓글 (자기 트윗에 Reply)
  if (firstComment && tweetId) {
    try {
      await fetch('https://api.x.com/2/tweets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: firstComment,
          reply: { in_reply_to_tweet_id: tweetId },
        }),
      });
    } catch (err) {
      console.error('X first comment failed:', err);
    }
  }

  return {
    platformPostId: tweetId,
    platformPostUrl: `https://x.com/i/status/${tweetId}`,
  };
}
