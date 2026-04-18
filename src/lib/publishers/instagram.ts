import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface InstagramPublishParams {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'reel';
  caption: string;
  firstComment?: string;
}

async function getInstagramToken() {
  const { data } = await supabase
    .from('platforms')
    .select('oauth_token, refresh_token')
    .eq('id', 'instagram')
    .single();

  if (!data?.oauth_token) throw new Error('Instagram not connected');
  return data.oauth_token;
}

async function getInstagramAccountId(accessToken: string): Promise<string> {
  // Facebook Pages → Instagram Business Account
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
  );
  const pagesData = await pagesRes.json();
  const pageId = pagesData.data?.[0]?.id;

  if (!pageId) throw new Error('No Facebook Page found');

  const igRes = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
  );
  const igData = await igRes.json();
  const igAccountId = igData.instagram_business_account?.id;

  if (!igAccountId) throw new Error('No Instagram Business Account linked');
  return igAccountId;
}

export async function publishToInstagram(params: InstagramPublishParams) {
  const { mediaUrl, mediaType, caption, firstComment } = params;
  const accessToken = await getInstagramToken();
  const igAccountId = await getInstagramAccountId(accessToken);

  // Step 1: Create media container
  const containerParams: Record<string, string> = {
    caption,
    access_token: accessToken,
  };

  if (mediaType === 'video' || mediaType === 'reel') {
    containerParams.media_type = 'REELS';
    containerParams.video_url = mediaUrl;
  } else {
    containerParams.image_url = mediaUrl;
  }

  const containerRes = await fetch(
    `https://graph.facebook.com/v21.0/${igAccountId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerParams),
    }
  );
  const containerData = await containerRes.json();

  if (containerData.error) {
    throw new Error(`Instagram container error: ${containerData.error.message}`);
  }

  const containerId = containerData.id;

  // Step 2: Wait for processing (images need a few seconds too)
  let status = 'IN_PROGRESS';
  let attempts = 0;
  const maxAttempts = mediaType === 'image' ? 10 : 30;
  const waitMs = mediaType === 'image' ? 3000 : 5000;
  while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, waitMs));
    const statusRes = await fetch(
      `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusRes.json();
    status = statusData.status_code;
    attempts++;
  }

  if (status !== 'FINISHED') {
    throw new Error(`Instagram processing failed: ${status}`);
  }

  // Step 3: Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`,
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
    throw new Error(`Instagram publish error: ${publishData.error.message}`);
  }

  const mediaId = publishData.id;

  // Step 4: 첫 댓글 작성
  if (firstComment && mediaId) {
    try {
      const commentRes = await fetch(
        `https://graph.facebook.com/v21.0/${mediaId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: firstComment,
            access_token: accessToken,
          }),
        }
      );
      const commentData = await commentRes.json();
      if (commentData.error) {
        console.error('Instagram comment error:', commentData.error.message);
      }
    } catch (err) {
      console.error('Instagram first comment failed:', err);
    }
  }

  return {
    platformPostId: mediaId,
    platformPostUrl: `https://www.instagram.com/p/${mediaId}/`,
  };
}
