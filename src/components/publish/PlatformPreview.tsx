'use client';

import PlatformIcon from '@/components/icons/PlatformIcon';
import type { PlatformId } from '@/types';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ThumbsUp, Eye } from 'lucide-react';

interface PreviewData {
  title: string;
  description: string;
  firstComment: string;
}

interface PlatformPreviewProps {
  platform: PlatformId;
  data: PreviewData;
  fileName?: string;
  mediaUrl?: string;
}

function MediaThumbnail({ mediaUrl, fileName, aspectClass = 'aspect-square', maxHClass = 'max-h-56' }: {
  mediaUrl?: string;
  fileName?: string;
  aspectClass?: string;
  maxHClass?: string;
}) {
  if (mediaUrl) {
    return (
      <div className={`relative ${aspectClass} ${maxHClass} bg-gray-900 overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl} alt={fileName || 'media'} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`relative ${aspectClass} ${maxHClass} bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center`}>
      <div className="text-center">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-white/30 mx-auto" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        {fileName && <p className="text-[10px] text-white/30 mt-1">{fileName}</p>}
      </div>
    </div>
  );
}

function YouTubePreview({ data, fileName, mediaUrl }: { data: PreviewData; fileName?: string; mediaUrl?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
        <PlatformIcon platform="youtube" className="w-4 h-4" colored />
        <span className="text-xs font-medium text-gray-600">YouTube</span>
      </div>
      <MediaThumbnail mediaUrl={mediaUrl} fileName={fileName} aspectClass="aspect-[9/16]" maxHClass="max-h-64" />
      <div className="p-3">
        <div className="flex gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug">
              {data.title || '제목을 입력하세요'}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">@loopdrop_creator</p>
            <p className="text-[11px] text-gray-400">조회수 0회 · 방금 전</p>
          </div>
          <MoreHorizontal className="w-4 h-4 text-gray-300 shrink-0" />
        </div>
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-50">
          <button className="flex items-center gap-1 text-[11px] text-gray-400"><ThumbsUp className="w-3.5 h-3.5" /> 좋아요</button>
          <button className="flex items-center gap-1 text-[11px] text-gray-400"><MessageCircle className="w-3.5 h-3.5" /> 댓글</button>
          <button className="flex items-center gap-1 text-[11px] text-gray-400"><Share2 className="w-3.5 h-3.5" /> 공유</button>
        </div>
        {data.firstComment && (
          <div className="mt-2 pt-2 border-t border-gray-50 flex gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500 line-clamp-2">{data.firstComment}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InstagramPreview({ data, fileName, mediaUrl }: { data: PreviewData; fileName?: string; mediaUrl?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
        <PlatformIcon platform="instagram" className="w-4 h-4" colored />
        <span className="text-xs font-medium text-gray-600">Instagram</span>
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-[2px]">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-gray-200" />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-900">loopdrop.official</span>
        </div>
        <MoreHorizontal className="w-4 h-4 text-gray-400" />
      </div>
      <MediaThumbnail mediaUrl={mediaUrl} fileName={fileName} aspectClass="aspect-square" maxHClass="max-h-56" />
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-gray-700" />
            <MessageCircle className="w-5 h-5 text-gray-700" />
            <Share2 className="w-5 h-5 text-gray-700" />
          </div>
          <Bookmark className="w-5 h-5 text-gray-700" />
        </div>
        <p className="text-[11px] text-gray-900 font-semibold mb-1">좋아요 0개</p>
        <p className="text-[11px] text-gray-700 line-clamp-3 whitespace-pre-line">
          <span className="font-semibold">loopdrop.official</span>{' '}
          {data.description || '설명을 입력하세요'}
        </p>
      </div>
    </div>
  );
}

function ThreadsPreview({ data, mediaUrl }: { data: PreviewData; fileName?: string; mediaUrl?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
        <PlatformIcon platform="threads" className="w-4 h-4" colored />
        <span className="text-xs font-medium text-gray-600">Threads</span>
      </div>
      <div className="p-3">
        <div className="flex gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-900">loopdrop.official</span>
              <span className="text-[10px] text-gray-400">· 방금</span>
            </div>
            <p className="text-xs text-gray-700 mt-1 whitespace-pre-line line-clamp-4">
              {data.description || '내용을 입력하세요'}
            </p>
            {mediaUrl && (
              <div className="mt-2 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl} alt="media" className="w-full max-h-40 object-cover rounded-lg" />
              </div>
            )}
            <div className="flex items-center gap-4 mt-2">
              <Heart className="w-4 h-4 text-gray-400" />
              <MessageCircle className="w-4 h-4 text-gray-400" />
              <Share2 className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TikTokPreview({ data, fileName, mediaUrl }: { data: PreviewData; fileName?: string; mediaUrl?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
        <PlatformIcon platform="tiktok" className="w-4 h-4" colored />
        <span className="text-xs font-medium text-gray-600">TikTok</span>
      </div>
      <div className="relative aspect-[9/16] max-h-64 bg-gradient-to-br from-gray-900 to-black overflow-hidden">
        {mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt={fileName || 'media'} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white/30" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-[11px] font-semibold mb-0.5">@loopdrop</p>
          <p className="text-white/80 text-[10px] line-clamp-2">{data.description || '설명을 입력하세요'}</p>
        </div>
        <div className="absolute right-2 bottom-12 flex flex-col items-center gap-3">
          <Heart className="w-5 h-5 text-white/70" />
          <MessageCircle className="w-5 h-5 text-white/70" />
          <Bookmark className="w-5 h-5 text-white/70" />
          <Share2 className="w-5 h-5 text-white/70" />
        </div>
      </div>
    </div>
  );
}

function XPreview({ data, mediaUrl }: { data: PreviewData; fileName?: string; mediaUrl?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
        <PlatformIcon platform="x" className="w-4 h-4" colored />
        <span className="text-xs font-medium text-gray-600">(Twitter)</span>
      </div>
      <div className="p-3">
        <div className="flex gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-900">LoopDrop</span>
              <span className="text-[10px] text-gray-400">@loopdrop · 방금</span>
            </div>
            <p className="text-xs text-gray-700 mt-1 whitespace-pre-line line-clamp-4">
              {data.description || '내용을 입력하세요'}
            </p>
            {mediaUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl} alt="media" className="w-full max-h-40 object-cover" />
              </div>
            )}
            <div className="flex items-center gap-6 mt-2">
              <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
              <Share2 className="w-3.5 h-3.5 text-gray-400" />
              <Heart className="w-3.5 h-3.5 text-gray-400" />
              <Eye className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PREVIEW_MAP: Record<PlatformId, React.FC<{ data: PreviewData; fileName?: string; mediaUrl?: string }>> = {
  youtube: YouTubePreview,
  instagram: InstagramPreview,
  threads: ThreadsPreview,
  tiktok: TikTokPreview,
  x: XPreview,
};

export default function PlatformPreview({ platform, data, fileName, mediaUrl }: PlatformPreviewProps) {
  const Preview = PREVIEW_MAP[platform];
  return <Preview data={data} fileName={fileName} mediaUrl={mediaUrl} />;
}
