'use client';

import clsx from 'clsx';
import Card from '@/components/ui/Card';
import PlatformIcon from '@/components/icons/PlatformIcon';
import { PLATFORM_CONFIG } from '@/lib/constants';
import { PLATFORM_IDS } from '@/lib/hooks/usePublishForm';
import type { UploadedFile } from '@/lib/hooks/useFileUpload';
import type { PlatformId } from '@/types';

interface PlatformSelectorProps {
  files: UploadedFile[];
  selectedPlatforms: Record<PlatformId, boolean>;
  connectedPlatforms: Set<PlatformId>;
  onToggle: (id: PlatformId) => void;
}

export default function PlatformSelector({
  files,
  selectedPlatforms,
  connectedPlatforms,
  onToggle,
}: PlatformSelectorProps) {
  const hasVideo = files.some((f) => f.type === 'video');

  return (
    <Card className="mb-6">
      <h2 className="text-sm font-medium text-gray-500 mb-3">발행 플랫폼 선택</h2>
      <div className="flex gap-3 flex-wrap">
        {PLATFORM_IDS.filter((id) => !(id === 'x' && hasVideo)).map((id) => {
          const config = PLATFORM_CONFIG[id];
          const connected = connectedPlatforms.has(id);
          const selected = selectedPlatforms[id];
          const videoOnly = id === 'youtube' || id === 'tiktok';
          const mediaBlocked =
            (videoOnly && files.length > 0 && !hasVideo) || (id === 'x' && files.length > 0);
          const disabled = !connected || mediaBlocked;

          return (
            <button
              key={id}
              onClick={() => !disabled && onToggle(id)}
              disabled={disabled}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer',
                disabled && 'opacity-40 cursor-not-allowed',
                selected && !disabled
                  ? 'border-indigo-500 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              <PlatformIcon platform={id} className="w-4 h-4" colored={!selected || disabled} />
              <span>{config.name}</span>
              {!connected && <span className="text-xs text-gray-400">(연결 필요)</span>}
              {mediaBlocked && id !== 'x' && <span className="text-xs text-gray-400">(영상만 가능)</span>}
              {mediaBlocked && id === 'x' && <span className="text-xs text-gray-400">(텍스트만 가능)</span>}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
