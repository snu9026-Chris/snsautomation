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

interface PublishParams {
  platform: string;
  mediaUrl: string;
  mediaType: string;
  title?: string;
  description?: string;
  firstComment?: string;
}

export async function publishToPlatform(params: PublishParams): Promise<PublishResult> {
  const { platform, mediaUrl, mediaType, title, description, firstComment } = params;

  try {
    switch (platform) {
      case 'instagram': {
        const igFormat = (params as unknown as Record<string, unknown>).instagramFormat as string | undefined;
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
        const tiktokOptions = (params as unknown as Record<string, unknown>).tiktokOptions as Record<string, unknown> | undefined;
        const result = await publishToTikTok({
          mediaUrl,
          title: description || title || '',
          tiktokOptions: tiktokOptions ? {
            privacyLevel: tiktokOptions.privacyLevel as string | undefined,
            disableComment: tiktokOptions.disableComment as boolean | undefined,
            disableDuet: tiktokOptions.disableDuet as boolean | undefined,
            disableStitch: tiktokOptions.disableStitch as boolean | undefined,
            brandContentToggle: tiktokOptions.brandContentToggle as boolean | undefined,
            brandOrganicToggle: tiktokOptions.brandOrganicToggle as boolean | undefined,
          } as Parameters<typeof publishToTikTok>[0]['tiktokOptions'] : undefined,
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
