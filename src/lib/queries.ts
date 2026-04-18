import { supabase } from './supabase';
import type { Platform, PublishLog, TrendingVideo } from '@/types';

// ── Platforms ──
export async function getPlatforms(): Promise<Platform[]> {
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .order('id');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    accountName: row.account_name,
    expiresAt: row.expires_at,
    connectedAt: row.connected_at,
    quotaUsed: row.quota_used,
    quotaTotal: row.quota_total,
  }));
}

export async function updatePlatformStatus(
  id: string,
  status: string,
  accountName?: string,
  expiresAt?: string
) {
  const { error } = await supabase
    .from('platforms')
    .update({
      status,
      account_name: accountName ?? null,
      expires_at: expiresAt ?? null,
      connected_at: status === 'connected' ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) throw error;
}

// ── Publish Logs ──
export async function getPublishLogs(filters?: {
  platform?: string;
  status?: string;
  limit?: number;
}): Promise<PublishLog[]> {
  let query = supabase
    .from('publish_logs')
    .select(`
      id,
      post_id,
      platform,
      status,
      error_message,
      platform_post_url,
      published_at,
      posts!inner(title, description, media_urls, media_type)
    `)
    .order('published_at', { ascending: false });

  if (filters?.platform && filters.platform !== 'all') {
    query = query.eq('platform', filters.platform);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const posts = row.posts as { title: string; description?: string; media_urls?: string[]; media_type?: string } | null;
    const mediaUrls = posts?.media_urls || [];
    return {
      id: row.id as string,
      postId: row.post_id as string,
      postTitle: posts?.title || posts?.description?.substring(0, 50) || '',
      thumbnailUrl: mediaUrls[0] || '',
      mediaType: posts?.media_type || 'image',
      platform: row.platform as Platform['id'],
      status: row.status as PublishLog['status'],
      errorMessage: row.error_message as string | undefined,
      platformPostUrl: row.platform_post_url as string | undefined,
      publishedAt: row.published_at as string,
    };
  });
}

// ── API Usage ──
export async function getApiUsage() {
  const { data, error } = await supabase
    .from('api_usage')
    .select('*');

  if (error) throw error;
  return data ?? [];
}

// ── Trending Videos ──
export async function getTrendingVideos(category?: string): Promise<TrendingVideo[]> {
  let query = supabase
    .from('trending_videos')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(30);

  if (category && category !== '전체') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    videoId: row.video_id,
    title: row.title,
    channelName: row.channel_name,
    thumbnailUrl: row.thumbnail_url,
    viewCount: row.view_count,
    category: row.category,
    publishedAt: row.published_at,
  }));
}

// ── Posts (발행) ──
export async function createPost(post: {
  title?: string;
  description?: string;
  firstComment?: string;
  mediaUrls: string[];
  mediaType: string;
}) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: post.title,
      description: post.description,
      first_comment: post.firstComment,
      media_urls: post.mediaUrls,
      media_type: post.mediaType,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function createPublishLog(log: {
  postId: string;
  platform: string;
  status: string;
  platformData?: Record<string, unknown>;
}) {
  const { error } = await supabase
    .from('publish_logs')
    .insert({
      post_id: log.postId,
      platform: log.platform,
      status: log.status,
      platform_data: log.platformData ?? {},
    });

  if (error) throw error;
}
