export type PlatformId = 'youtube' | 'instagram' | 'threads' | 'tiktok' | 'x';

export type ConnectionStatus = 'connected' | 'expired' | 'disconnected';

export type PublishStatus = 'success' | 'failed' | 'pending';

export interface Platform {
  id: PlatformId;
  name: string;
  status: ConnectionStatus;
  accountName?: string;
  expiresAt?: string;
  connectedAt?: string;
  quotaUsed: number;
  quotaTotal: number;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  firstComment: string;
  mediaUrl: string;
  thumbnailUrl: string;
  createdAt: string;
}

export interface PublishLog {
  id: string;
  postId: string;
  postTitle: string;
  thumbnailUrl: string;
  mediaType: string;
  platform: PlatformId;
  status: PublishStatus;
  errorMessage?: string;
  platformPostUrl?: string;
  publishedAt: string;
}

export interface TrendingVideo {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  viewCount: number;
  category: string;
  publishedAt: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  type: 'first_comment' | 'description';
}

export type ScheduleStatus = 'scheduled' | 'published' | 'cancelled' | 'failed';

export interface ScheduledPost {
  id: string;
  postId: string;
  scheduledAt: string;
  status: ScheduleStatus;
  platforms: PlatformId[];
  platformData: Record<string, {
    title: string;
    description: string;
    firstComment: string;
    instagramFormat?: string;
    tiktokOptions?: Record<string, unknown>;
  }>;
  mediaUrls: string[];
  mediaType: string;
  createdAt: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}
