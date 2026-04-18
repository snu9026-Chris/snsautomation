'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ConnectionBadge, PublishBadge } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import PlatformIcon from '@/components/icons/PlatformIcon';
import { getPlatforms, getPublishLogs, getApiUsage } from '@/lib/queries';
import { PLATFORM_CONFIG } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';
import { Upload, Sparkles } from 'lucide-react';
import type { Platform, PublishLog } from '@/types';

export default function DashboardPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [logs, setLogs] = useState<PublishLog[]>([]);
  const [apiUsage, setApiUsage] = useState<{ service: string; used: number; total: number }[]>([]);
  const [gptBalance, setGptBalance] = useState<{ totalUsageUsd?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPlatforms(),
      getPublishLogs({ limit: 6 }),
      getApiUsage(),
    ]).then(([p, l, a]) => {
      setPlatforms(p);
      setLogs(l);
      setApiUsage(a);
      setLoading(false);
    });
    // GPT 잔액은 별도 (실패해도 무시)
    fetch('/api/quota/balance').then((r) => r.ok ? r.json() : null).then(setGptBalance).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">대시보드</h1>
        </div>
        <div className="grid grid-cols-5 gap-3 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="h-24 animate-pulse bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  const connectedPlatforms = platforms.filter((p) => p.status === 'connected');

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">대시보드</h1>
        <Link href="/publish">
          <Button variant="primary" size="lg">
            <Upload className="w-4 h-4" />
            새 콘텐츠 발행
          </Button>
        </Link>
      </div>

      {/* SNS 연결 상태 카드 */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 mb-3">플랫폼 연결 상태</h2>
        <div className="grid grid-cols-5 gap-3">
          {platforms.map((platform) => {
            const config = PLATFORM_CONFIG[platform.id];
            if (!config) return null;
            return (
              <Link key={platform.id} href="/accounts">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${config.color}10` }}
                    >
                      <PlatformIcon platform={platform.id} className="w-4.5 h-4.5" colored />
                    </div>
                    <span className="font-medium text-gray-800 text-sm">{config.name}</span>
                  </div>
                  <ConnectionBadge status={platform.status} />
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 최근 발행 이력 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500">최근 발행 이력</h2>
          <Link href="/history" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            전체 보기 →
          </Link>
        </div>
        <Card>
          {logs.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <PlatformIcon platform={log.platform} className="w-3.5 h-3.5" colored />
                        <span className="text-xs text-gray-400">{formatRelativeTime(log.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <PublishBadge status={log.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">아직 발행 이력이 없습니다.</p>
          )}
        </Card>
      </section>

      {/* API 할당량 */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 mb-3">API 할당량</h2>
        <div className="grid grid-cols-3 gap-3">
          {connectedPlatforms.map((platform) => {
            const config = PLATFORM_CONFIG[platform.id];
            if (!config) return null;
            const quotaInfo: Record<string, { total: number; period: string }> = {
              youtube: { total: 10000, period: '/일 (units)' },
              instagram: { total: 25, period: '/일' },
              threads: { total: 250, period: '/일' },
              tiktok: { total: 5, period: '/일 (Sandbox)' },
              x: { total: 500, period: '/월 (Free)' },
            };
            const info = quotaInfo[platform.id] || { total: platform.quotaTotal, period: '' };
            return (
              <Card key={platform.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={platform.id} className="w-4 h-4" colored />
                    <span className="text-sm font-medium text-gray-700">{config.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{info.period}</span>
                </div>
                <ProgressBar value={platform.quotaUsed} max={info.total} />
              </Card>
            );
          })}
          {apiUsage.map((api) => {
            const isGpt = api.service !== 'claude';
            // GPT 4o-mini: 입력 $0.15/1M + 출력 $0.60/1M ≈ 평균 $0.375/1M tokens
            const estimatedCostKrw = isGpt ? Math.round(api.used * 0.000000375 * 1450) : 0; // 토큰 × 단가 × 환율
            return (
              <Card key={api.service}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 flex items-center justify-center" style={{ color: api.service === 'claude' ? '#D97706' : '#10A37F' }}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {api.service === 'claude' ? 'Claude API' : 'GPT API'}
                    </span>
                  </div>
                  {isGpt && (
                    <span className="text-xs text-gray-400">충전식</span>
                  )}
                </div>
                {isGpt ? (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{api.used.toLocaleString()} 토큰 사용</span>
                      <span>~₩{estimatedCostKrw.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${Math.min((api.used / api.total) * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-300">
                      <span>gpt-4o-mini</span>
                      {gptBalance?.totalUsageUsd != null ? (
                        <span>이번 달 ${gptBalance.totalUsageUsd.toFixed(2)} 사용</span>
                      ) : (
                        <span>~₩0.5/추천 1회</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <ProgressBar value={api.used} max={api.total} />
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
