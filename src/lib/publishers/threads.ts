import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ThreadsPublishParams {
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

async function getThreadsToken() {
  const { data } = await supabase
    .from('platforms')
    .select('oauth_token, expires_at')
    .eq('id', 'threads')
    .single();

  if (!data?.oauth_token) throw new Error('Threads not connected');

  // 만료 7일 전이면 장기 토큰 갱신 (60일 → 60일 연장)
  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (expiresAt && expiresAt - Date.now() < sevenDays) {
    try {
      const refreshRes = await fetch(
        `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${data.oauth_token}`
      );
      const refreshData = await refreshRes.json();
      if (refreshData.access_token) {
        const newExpiresAt = new Date(Date.now() + (refreshData.expires_in || 5184000) * 1000).toISOString();
        await supabase
          .from('platforms')
          .update({ oauth_token: refreshData.access_token, expires_at: newExpiresAt })
          .eq('id', 'threads');
        return refreshData.access_token;
      }
    } catch (err) {
      console.error('Threads token refresh failed:', err);
    }
  }

  return data.oauth_token;
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
  const accessToken = await getThreadsToken();
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
