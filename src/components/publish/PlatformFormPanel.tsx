'use client';

import clsx from 'clsx';
import { ChevronDown, Info, Sparkles } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PlatformIcon from '@/components/icons/PlatformIcon';
import { PLATFORM_CONFIG } from '@/lib/constants';
import type { PlatformId, Platform } from '@/types';
import type {
  AiPlatformOptions,
  PlatformData,
  TikTokOptions,
} from '@/lib/hooks/usePublishForm';
import type { UploadedFile } from '@/lib/hooks/useFileUpload';

interface PlatformFormPanelProps {
  platformId: PlatformId;
  data: PlatformData;
  loadingAi: boolean;
  aiOptions?: AiPlatformOptions;
  files: UploadedFile[];
  instagramFormat: 'reel' | 'post';
  onInstagramFormatChange: (fmt: 'reel' | 'post') => void;
  tiktokOptions: TikTokOptions;
  onTiktokOptionsChange: (next: TikTokOptions) => void;
  tiktokAccountName?: string;
  onUpdateField: (platform: PlatformId, field: keyof PlatformData, value: string) => void;
  onAiRecommend: (platform: PlatformId) => void;
  /** publish 페이지는 true (AI 옵션 칩, TikTok 패널, YouTube 댓글 토글, 글자수 표시) */
  variant?: 'publish' | 'compact';
  descriptionRows?: number;
  /** TikTok 계정 이름 표시용 */
  platforms?: Platform[];
}

export default function PlatformFormPanel({
  platformId: id,
  data,
  loadingAi,
  aiOptions,
  files,
  instagramFormat,
  onInstagramFormatChange,
  tiktokOptions,
  onTiktokOptionsChange,
  onUpdateField,
  onAiRecommend,
  variant = 'compact',
  descriptionRows,
  platforms,
}: PlatformFormPanelProps) {
  const config = PLATFORM_CONFIG[id];
  const isPublishVariant = variant === 'publish';
  const showFirstComment = id === 'youtube' || id === 'instagram' || id === 'x';
  const tiktokAccount = platforms?.find((p) => p.id === 'tiktok')?.accountName;
  const hasVideo = files.some((f) => f.type === 'video');
  const rows = descriptionRows ?? (isPublishVariant ? 5 : 4);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={id} className="w-4 h-4" colored />
          <span className="font-semibold text-sm text-gray-800">{config.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onAiRecommend(id)} disabled={loadingAi}>
          <Sparkles className={clsx('w-3 h-3', loadingAi && 'animate-spin')} />
          {loadingAi ? '추천 중...' : 'AI 추천'}
        </Button>
      </div>

      <div className="space-y-2.5">
        {id === 'instagram' && (
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">게시 형식</label>
            <div className="flex gap-2">
              <button
                onClick={() => onInstagramFormatChange('post')}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all',
                  instagramFormat === 'post'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                )}
              >
                📷 게시물
              </button>
              <button
                onClick={() => hasVideo && onInstagramFormatChange('reel')}
                disabled={!hasVideo}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-medium border transition-all',
                  !hasVideo
                    ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-300'
                    : instagramFormat === 'reel'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600 cursor-pointer'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 cursor-pointer'
                )}
              >
                🎬 릴스 {!hasVideo && isPublishVariant && '(영상만)'}
              </button>
            </div>
          </div>
        )}

        {id === 'tiktok' && isPublishVariant && (
          <div className="space-y-3 p-3 bg-pearl-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Info className="w-3.5 h-3.5 text-gray-400" />
              <span>
                이 영상은 <strong className="text-gray-700">{tiktokAccount || '@사용자'}</strong> 계정으로 게시됩니다
              </span>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">공개 범위</label>
              <div className="relative">
                <select
                  value={tiktokOptions.privacyLevel}
                  onChange={(e) =>
                    onTiktokOptionsChange({
                      ...tiktokOptions,
                      privacyLevel: e.target.value as TikTokOptions['privacyLevel'],
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none cursor-pointer"
                >
                  <option value="PUBLIC_TO_EVERYONE">모든 사람에게 공개</option>
                  <option value="MUTUAL_FOLLOW_FRIENDS">서로 팔로우한 친구만</option>
                  <option value="FOLLOWER_OF_CREATOR">팔로워만</option>
                  <option value="SELF_ONLY">나만 보기</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">상호작용 허용</label>
              <div className="flex gap-2">
                {[
                  { key: 'disableComment' as const, label: '댓글' },
                  { key: 'disableDuet' as const, label: '듀엣' },
                  { key: 'disableStitch' as const, label: '스티치' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() =>
                      onTiktokOptionsChange({ ...tiktokOptions, [key]: !tiktokOptions[key] })
                    }
                    className={clsx(
                      'px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all',
                      !tiktokOptions[key]
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    )}
                  >
                    {!tiktokOptions[key] ? '✓' : '✗'} {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">상업적 콘텐츠 공개</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tiktokOptions.brandContentToggle}
                    onChange={(e) =>
                      onTiktokOptionsChange({ ...tiktokOptions, brandContentToggle: e.target.checked })
                    }
                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-200 cursor-pointer"
                  />
                  <span className="text-xs text-gray-600">브랜드 콘텐츠 (제3자에 의한 프로모션)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tiktokOptions.brandOrganicToggle}
                    onChange={(e) =>
                      onTiktokOptionsChange({ ...tiktokOptions, brandOrganicToggle: e.target.checked })
                    }
                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-200 cursor-pointer"
                  />
                  <span className="text-xs text-gray-600">자체 브랜드 홍보 (본인 제품/서비스 홍보)</span>
                </label>
              </div>
            </div>

            <div className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg p-2">
              ⚠️ 이 영상에 저작권이 있는 음악이 포함된 경우, 게시 후 TikTok에 의해 음소거되거나 삭제될 수 있습니다. 원본 사운드 또는 라이선스가 있는 음악만 사용하세요.
            </div>
          </div>
        )}

        {config.maxTitleLength > 0 && (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">제목</label>
            <div className="relative">
              <input
                type="text"
                value={data.title}
                onChange={(e) => onUpdateField(id, 'title', e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={config.maxTitleLength}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
              />
              {isPublishVariant && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-300">
                  {data.title.length}/{config.maxTitleLength}
                </span>
              )}
            </div>
            {isPublishVariant && aiOptions && aiOptions.titles.length > 1 && (
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {aiOptions.titles.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => onUpdateField(id, 'title', t)}
                    className={clsx(
                      'px-2 py-0.5 rounded text-xs border cursor-pointer transition-all',
                      data.title === t
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    )}
                  >
                    옵션 {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-xs text-gray-400 mb-1 block">설명</label>
          <div className="relative">
            <textarea
              value={data.description}
              onChange={(e) => onUpdateField(id, 'description', e.target.value)}
              placeholder="설명을 입력하세요"
              maxLength={config.maxDescriptionLength}
              rows={rows}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
            />
            {isPublishVariant && (
              <span className="absolute right-2 bottom-1.5 text-xs text-gray-300">
                {data.description.length}/{config.maxDescriptionLength}
              </span>
            )}
          </div>
        </div>

        {showFirstComment && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">첫 댓글</label>
              {isPublishVariant && id === 'youtube' && (
                <div className="flex gap-1.5">
                  <span className="px-2 py-0.5 rounded text-xs border border-indigo-400 bg-indigo-50 text-indigo-600">
                    ✦ 일반 댓글
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs border border-gray-200 text-gray-300 line-through cursor-not-allowed"
                    title="YouTube API에서 고정 댓글을 지원하지 않습니다"
                  >
                    📌 고정 댓글
                  </span>
                </div>
              )}
            </div>
            <textarea
              value={data.firstComment}
              onChange={(e) => onUpdateField(id, 'firstComment', e.target.value)}
              placeholder="첫 댓글 (선택)"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
            />
            {isPublishVariant && aiOptions && aiOptions.firstComments.length > 1 && (
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {aiOptions.firstComments.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => onUpdateField(id, 'firstComment', c)}
                    className={clsx(
                      'px-2 py-0.5 rounded text-xs border cursor-pointer transition-all max-w-full truncate',
                      data.firstComment === c
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    )}
                  >
                    {c.length > 30 ? c.substring(0, 30) + '...' : c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
