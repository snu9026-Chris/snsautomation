import { ensureValidToken } from '@/lib/services/token-refresh';

interface ThreadsPublishParams {
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

async function getThreadsUserId(accessToken: string): Promise<string> {
  const res = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id&access_token=${accessToken}`
  );
  const data = await res.json();
  if (!data.id) throw new Error('Failed to get Threads user ID');
  return data.id;
}

export async function publishToThreads(params: ThreadsPublishParams) {
  const { text, mediaUrl, mediaType } = params;
  const accessToken = await ensureValidToken('threads');
  const userId = await getThreadsUserId(accessToken);

  // Step 1: Create media container
  const containerParams: Record<string, string> = {
    text,
    access_token: accessToken,
  };

  if (mediaUrl && mediaType) {
    containerParams.media_type = mediaType === 'video' ? 'VIDEO' : 'IMAGE';
    if (mediaType === 'video') {
      containerParams.video_url = mediaUrl;
    } else {
      containerParams.image_url = mediaUrl;
    }
  } else {
    containerParams.media_type = 'TEXT';
  }

  const containerRes = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerParams),
    }
  );
  const containerData = await containerRes.json();

  if (containerData.error) {
    throw new Error(`Threads container error: ${containerData.error.message}`);
  }

  const containerId = containerData.id;

  // Step 2: For video, wait for processing
  if (mediaType === 'video') {
    let status = 'IN_PROGRESS';
    let attempts = 0;
    while (status === 'IN_PROGRESS' && attempts < 30) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(
        `https://graph.threads.net/v1.0/${containerId}?fields=status&access_token=${accessToken}`
      );
      const statusData = await statusRes.json();
      status = statusData.status;
      attempts++;
    }
    if (status !== 'FINISHED') {
      throw new Error(`Threads video processing failed: ${status}`);
    }
  }

  // Step 3: Publish
  const publishRes = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );
  const publishData = await publishRes.json();

  if (publishData.error) {
    throw new Error(`Threads publish error: ${publishData.error.message}`);
  }

  return {
    platformPostId: publishData.id,
    platformPostUrl: `https://www.threads.net/post/${publishData.id}`,
  };
}
