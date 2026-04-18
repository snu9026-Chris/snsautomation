'use client';

import { Calendar, Plus, Edit3, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import PlatformIcon from '@/components/icons/PlatformIcon';
import type { ScheduledPost, PlatformId } from '@/types';
import clsx from 'clsx';

interface Props {
  date: string | null;
  posts: ScheduledPost[];
  onCreateNew: () => void;
  onEdit: (post: ScheduledPost) => void;
  onCancel: (id: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: '예약됨', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  published: { label: '발행 완료', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  failed: { label: '실패', color: 'text-red-500 bg-red-50 border-red-200' },
  cancelled: { label: '취소됨', color: 'text-gray-400 bg-gray-50 border-gray-200' },
};

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

export default function DayPanel({ date, posts, onCreateNew, onEdit, onCancel }: Props) {
  if (!date) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-12">
        <Calendar className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-sm text-gray-400">날짜를 선택하세요</p>
      </div>
    );
  }

  // KST 기준으로 오늘 이전인지 체크
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isPast = date < todayStr;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        {formatDisplayDate(date)}
      </h3>

      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400 mb-3">예약된 콘텐츠가 없습니다</p>
          {!isPast && (
            <Button variant="secondary" size="sm" onClick={onCreateNew}>
              <Plus className="w-3.5 h-3.5" />
              새 예약 추가
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const statusInfo = STATUS_LABELS[post.status] || STATUS_LABELS.scheduled;
            const mainData = post.platformData[post.platforms[0]];

            return (
              <div key={post.id} className="p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all">
                {/* 상태 + 플랫폼 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {post.platforms.map((pid) => (
                      <PlatformIcon key={pid} platform={pid as PlatformId} className="w-4 h-4" colored />
                    ))}
                  </div>
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full border', statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* 제목/설명 */}
                <p className="text-sm text-gray-700 font-medium truncate">
                  {mainData?.title || mainData?.description || '(내용 없음)'}
                </p>
                {mainData?.description && mainData.title && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{mainData.description.substring(0, 50)}</p>
                )}

                {/* 액션 버튼 */}
                {post.status === 'scheduled' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => onEdit(post)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-500 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3" /> 수정
                    </button>
                    <button
                      onClick={() => onCancel(post.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" /> 취소
                    </button>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}
