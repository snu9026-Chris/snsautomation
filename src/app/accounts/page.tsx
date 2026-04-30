'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ConnectionBadge } from '@/components/ui/Badge';
import PlatformIcon from '@/components/icons/PlatformIcon';
import { updatePlatformStatus } from '@/lib/queries';
import { PLATFORM_CONFIG } from '@/lib/constants';
import { daysUntil, formatDate } from '@/lib/utils';
import { usePlatforms } from '@/lib/context/PlatformsContext';
import { CheckCircle, AlertCircle } from 'lucide-react';

function AccountsContent() {
  const { platforms, loading, refresh } = usePlatforms();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // OAuth 콜백 결과 처리
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      const name = PLATFORM_CONFIG[connected as keyof typeof PLATFORM_CONFIG]?.name || connected;
      setToast({ type: 'success', message: `${name} 계정이 연결되었습니다.` });
      window.history.replaceState({}, '', '/accounts');
      void refresh();
    } else if (error) {
      setToast({ type: 'error', message: `연결 실패: ${decodeURIComponent(error)}` });
      window.history.replaceState({}, '', '/accounts');
    }
  }, [searchParams, refresh]);

  // 토스트 자동 해제
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const connectPlatform = (id: string) => {
    window.location.href = `/api/auth/${id}`;
  };

  const disconnectPlatform = async (id: string) => {
    await updatePlatformStatus(id, 'disconnected');
    await refresh();
    const name = PLATFORM_CONFIG[id as keyof typeof PLATFORM_CONFIG]?.name || id;
    setToast({ type: 'success', message: `${name} 연결이 해제되었습니다.` });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="h-20 animate-pulse bg-gray-50" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* 토스트 알림 */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <div className="space-y-4">
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform.id];
          if (!config) return null;
          const remaining = platform.expiresAt ? daysUntil(platform.expiresAt) : null;

          return (
            <Card key={platform.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${config.color}10` }}
                >
                  <PlatformIcon platform={platform.id} className="w-6 h-6" colored />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{config.name}</span>
                    <ConnectionBadge status={platform.status} />
                  </div>
                  {platform.accountName && (
                    <p className="text-sm text-gray-500 mt-0.5">{platform.accountName}</p>
                  )}
                  {platform.expiresAt && platform.status !== 'disconnected' && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      토큰 만료: {formatDate(platform.expiresAt)}
                      {remaining !== null && remaining > 0 && (
                        <span className="ml-1 text-gray-300">({remaining}일 남음)</span>
                      )}
                      {remaining !== null && remaining <= 0 && (
                        <span className="ml-1 text-red-400">(만료됨)</span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div>
                {platform.status === 'connected' ? (
                  <Button variant="danger" size="sm" onClick={() => disconnectPlatform(platform.id)}>
                    연결 해제
                  </Button>
                ) : platform.status === 'expired' ? (
                  <Button variant="primary" size="sm" onClick={() => connectPlatform(platform.id)}>
                    재연결
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => connectPlatform(platform.id)}>
                    연결하기
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export default function AccountsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">SNS 계정 연결</h1>
      <Suspense fallback={
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="h-20 animate-pulse bg-gray-50" />
          ))}
        </div>
      }>
        <AccountsContent />
      </Suspense>
    </div>
  );
}
