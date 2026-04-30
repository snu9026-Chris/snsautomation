'use client';

import clsx from 'clsx';
import Card from '@/components/ui/Card';

const CONTENT_TYPES = [
  { id: 'daily', label: '일상/브이로그', emoji: '📷' },
  { id: 'info', label: '정보/팁', emoji: '💡' },
  { id: 'promo', label: '홍보/광고', emoji: '📢' },
  { id: 'review', label: '리뷰/후기', emoji: '⭐' },
  { id: 'meme', label: '밈/유머', emoji: '😂' },
] as const;

interface ContentTypeSelectorProps {
  contentType: string;
  contentDescription: string;
  onContentTypeChange: (id: string) => void;
  onContentDescriptionChange: (text: string) => void;
  showDescriptionHint?: boolean;
}

export default function ContentTypeSelector({
  contentType,
  contentDescription,
  onContentTypeChange,
  onContentDescriptionChange,
  showDescriptionHint = true,
}: ContentTypeSelectorProps) {
  return (
    <Card className="mb-6">
      <h2 className="text-sm font-medium text-gray-500 mb-3">콘텐츠 유형</h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        {CONTENT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onContentTypeChange(type.id)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border',
              contentType === type.id
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            )}
          >
            {type.emoji} {type.label}
          </button>
        ))}
      </div>

      <h2 className="text-sm font-medium text-gray-500 mb-2">콘텐츠 설명</h2>
      {showDescriptionHint && (
        <p className="text-xs text-gray-400 mb-3">
          이 콘텐츠가 어떤 내용인지 간단히 설명하면 AI가 유형에 맞춰 플랫폼별 텍스트를 추천합니다.
        </p>
      )}
      <textarea
        value={contentDescription}
        onChange={(e) => onContentDescriptionChange(e.target.value)}
        placeholder="예: 한강에서 자전거 타는 브이로그, 봄날 벚꽃 구경"
        rows={2}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
      />
    </Card>
  );
}
