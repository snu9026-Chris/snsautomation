'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PublishBadge } from '@/components/ui/Badge';
import PlatformIcon from '@/components/icons/PlatformIcon';
import { getPublishLogs } from '@/lib/queries';
import { PLATFORM_CONFIG } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import type { PlatformId, PublishStatus, PublishLog, ScheduledPost } from '@/types';
import { ExternalLink, RotateCcw, ChevronDown, ChevronUp, CalendarCheck, Clock, Send, X as XIcon } from 'lucide-react';
import clsx from 'clsx';

type PlatformFilter = 'all' | PlatformId;
type StatusFilter = 'all' | PublishStatus;
type TabType = 'published' | 'scheduled';

const SCHEDULE_STATUS: Record<string, { label: string; color: string }> = {
  scheduled: { label: '예약 대기', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  published: { label: '발행 완료', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  failed: { label: '실패', color: 'text-red-500 bg-red-50 border-red-200' },
  cancelled: { label: '취소', color: 'text-gray-400 bg-gray-50 border-gray-200' },
};

function formatScheduleTime(isoStr: string) {
  const d = new Date(isoStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

export default function HistoryPage() {
  const [tab, setTab] = useState<TabType>('published');
  const [logs, setLogs] = useState<PublishLog[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  // 발행 히스토리
  useEffect(() => {
    if (tab === 'published') {
      setLoading(true);
      getPublishLogs({ platform: platformFilter, status: statusFilter })
        .then((data) => { setLogs(data); setLoading(false); });
    }
  }, [platformFilter, statusFilter, tab]);

  // 예약 현황
  const fetchScheduled = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/schedule?month=0&year=0'); // 전체 조회용
      // 전체 조회: 최근 3개월
      const now = new Date();
      const promises = [-1, 0, 1, 2].map(offset => {
        const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        return fetch(`/api/schedule?month=${d.getMonth() + 1}&year=${d.getFullYear()}`).then(r => r.json());
      });
      const results = await Promise.all(promises);
      const all = results.flat().filter(Array.isArray(results[0]) ? Boolean : () => false);
      const merged = results.reduce((acc, arr) => Array.isArray(arr) ? [...acc, ...arr] : acc, [] as ScheduledPost[]);
      // 중복 제거
      const unique = merged.filter((post: ScheduledPost, i: number, arr: ScheduledPost[]) => arr.findIndex((p: ScheduledPost) => p.id === post.id) === i);
      setScheduledPosts(unique.sort((a: ScheduledPost, b: ScheduledPost) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'scheduled') fetchScheduled();
  }, [tab, fetchScheduled]);

  // 수동 발행 트리거
  const handleManualPublish = async (post: ScheduledPost) => {
    setPublishing(post.id);
    try {
      // 직접 발행 API 호출
      const mainPlatform = post.platforms[0];
      const mainData = post.platformData[mainPlatform];
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: post.platforms,
          mediaUrls: post.mediaUrls,
          mediaType: post.mediaType,
          platformData: post.platformData,
        }),
      });
      if (res.ok) {
        // scheduled_posts 상태 업데이트
        await fetch(`/api/schedule/${post.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
        }).catch(() => {});
        fetchScheduled();
      }
    } catch { /* ignore */ }
    setPublishing(null);
  };

  // 예약 취소
  const handleCancel = async (id: string) => {
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
    fetchScheduled();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">발행 히스토리</h1>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('published')}
          className={clsx(
            'px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer',
            tab === 'published'
              ? 'border-indigo-500 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          )}
        >
          발행 완료
        </button>
        <button
          onClick={() => setTab('scheduled')}
          className={clsx(
            'px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer',
            tab === 'scheduled'
              ? 'border-indigo-500 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          )}
        >
          <span className="flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4" />
            예약 현황
          </span>
        </button>
      </div>

      {/* 발행 완료 탭 */}
      {tab === 'published' && (
        <>
          <Card className="mb-6 flex items-center gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">플랫폼</label>
              <select value={platformFilter}
                onChange={(e) => { setPlatformFilter(e.target.value as PlatformFilter); setLoading(true); }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <option value="all">전체</option>
                {Object.entries(PLATFORM_CONFIG).map(([id, config]) => (
                  <option key={id} value={id}>{config.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">상태</label>
              <select value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setLoading(true); }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <option value="all">전체</option>
                <option value="success">성공</option>
                <option value="failed">실패</option>
                <option value="pending">대기</option>
              </select>
            </div>
            <div className="ml-auto text-xs text-gray-400">{loading ? '...' : `${logs.length}건`}</div>
          </Card>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Card key={i} className="h-16 animate-pulse bg-gray-50" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const expanded = expandedId === log.id;
                return (
                  <Card key={log.id} className="transition-all duration-200">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expanded ? null : log.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                          {log.thumbnailUrl ? (
                            log.mediaType === 'video' ? (
                              <video src={log.thumbnailUrl} className="w-full h-full object-cover" muted preload="metadata" />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={log.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            )
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{log.postTitle || '(제목 없음)'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <PlatformIcon platform={log.platform} className="w-3.5 h-3.5" colored />
                            <span className="text-xs text-gray-400">{formatDateTime(log.publishedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <PublishBadge status={log.status} />
                        {log.platformPostUrl && (
                          <a href={log.platformPostUrl} target="_blank" rel="noopener noreferrer"
                            className="text-gray-300 hover:text-gray-500 transition-colors" onClick={(e) => e.stopPropagation()}>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {log.status === 'failed' && (expanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />)}
                      </div>
                    </div>
                    {expanded && log.status === 'failed' && log.errorMessage && (
                      <div className="mt-4 pt-4 border-t border-gray-50">
                        <div className="bg-red-50 rounded-lg p-3 flex items-start justify-between">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">에러 사유</p>
                            <p className="text-sm text-red-500">{log.errorMessage}</p>
                          </div>
                          <Button variant="secondary" size="sm"><RotateCcw className="w-3 h-3" /> 재시도</Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
              {logs.length === 0 && <div className="text-center py-16 text-gray-400 text-sm">발행 이력이 없습니다.</div>}
            </div>
          )}
        </>
      )}

      {/* 예약 현황 탭 */}
      {tab === 'scheduled' && (
        <>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Card key={i} className="h-16 animate-pulse bg-gray-50" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {scheduledPosts.map((post) => {
                const statusInfo = SCHEDULE_STATUS[post.status] || SCHEDULE_STATUS.scheduled;
                const mainPlatform = post.platforms[0];
                const mainData = post.platformData[mainPlatform];
                const isOverdue = post.status === 'scheduled' && new Date(post.scheduledAt) <= new Date();

                return (
                  <Card key={post.id} className="transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* 플랫폼 아이콘들 */}
                        <div className="flex items-center gap-1 shrink-0">
                          {post.platforms.map((pid) => (
                            <PlatformIcon key={pid} platform={pid as PlatformId} className="w-5 h-5" colored />
                          ))}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">
                            {mainData?.title || mainData?.description || '(내용 없음)'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className={clsx('text-xs', isOverdue ? 'text-amber-500 font-medium' : 'text-gray-400')}>
                              {formatScheduleTime(post.scheduledAt)} KST
                              {isOverdue && ' (발행 시간 지남)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full border', statusInfo.color)}>
                          {statusInfo.label}
                        </span>

                        {post.status === 'scheduled' && (
                          <>
                            {/* 수동 발행 버튼 */}
                            <Button variant="primary" size="sm"
                              disabled={publishing === post.id}
                              onClick={() => handleManualPublish(post)}
                            >
                              {publishing === post.id ? (
                                <><RotateCcw className="w-3 h-3 animate-spin" /> 발행 중</>
                              ) : (
                                <><Send className="w-3 h-3" /> 지금 발행</>
                              )}
                            </Button>
                            {/* 취소 */}
                            <button
                              onClick={() => handleCancel(post.id)}
                              className="text-gray-300 hover:text-red-400 cursor-pointer transition-colors p-1"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}

              {scheduledPosts.length === 0 && (
                <div className="text-center py-16 text-gray-400 text-sm">예약된 콘텐츠가 없습니다.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
