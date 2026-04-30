import { publishToInstagram } from './instagram';
import { publishToYouTube } from './youtube';
import { publishToThreads } from './threads';
import { publishToTikTok } from './tiktok';
import { publishToX } from './x';

export type PublishResult = {
  platform: string;
  status: 'success' | 'failed';
  platformPostUrl?: string;
  errorMessage?: string;
};

export interface TikTokPublishOptions {
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY';
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
  brandContentToggle?: boolean;
  brandOrganicToggle?: boolean;
}

export interface PublishParams {
  platform: string;
  mediaUrl: string;
  mediaType: string;
  title?: string;
  description?: string;
  firstComment?: string;
  instagramFormat?: 'image' | 'video' | 'reel' | 'post';
  tiktokOptions?: TikTokPublishOptions;
}

export async function publishToPlatform(params: PublishParams): Promise<PublishResult> {
  const { platform, mediaUrl, mediaType, title, description, firstComment } = params;

  try {
    switch (platform) {
      case 'instagram': {
        const igFormat = params.instagramFormat;
        let igMediaType: 'image' | 'video' | 'reel' = 'image';
        if (mediaType === 'video') {
          igMediaType = igFormat === 'post' ? 'video' : 'reel';
        } else {
          igMediaType = igFormat === 'reel' ? 'reel' : 'image';
        }
        const result = await publishToInstagram({
          mediaUrl,
          mediaType: igMediaType,
          caption: description || '',
          firstComment,
        });
        return { platform, status: 'success', platformPostUrl: result.platformPostUrl };
      }

      case 'youtube': {
        if (mediaType !== 'video') {
          return { platform, status: 'failed', errorMessage: 'YouTube는 영상만 업로드 가능합니다.' };
        }
        const result = await publishToYouTube({
          mediaUrl,
          title: title || 'Untitled',
          description: description || '',
          firstComment,
        });
        return { platform, status: 'success', platformPostUrl: result.platformPostUrl };
      }

      case 'threads': {
        const result = await publishToThreads({
          text: description || '',
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaType === 'video' ? 'video' : 'image',
        });
        return { platform, status: 'success', platformPostUrl: result.platformPostUrl };
      }

      case 'tiktok': {
        if (mediaType !== 'video') {
          return { platform, status: 'failed', errorMessage: 'TikTok은 영상만 업로드 가능합니다.' };
        }
        const result = await publishToTikTok({
          mediaUrl,
          title: description || title || '',
          tiktokOptions: params.tiktokOptions,
        });
        return { platform, status: 'success', platformPostUrl: result.platformPostUrl };
      }

      case 'x': {
        const result = await publishToX({
          text: description || '',
          mediaUrl: undefined, // X Free tier는 미디어 업로드 불가
          mediaType: undefined,
          firstComment,
        });
        return { platform, status: 'success', platformPostUrl: result.platformPostUrl };
      }

      default:
        return { platform, status: 'failed', errorMessage: `Unknown platform: ${platform}` };
    }
  } catch (err) {
    return {
      platform,
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
