'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import HeroAnimation from '@/components/landing/HeroAnimation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const pathname = usePathname();

  // /preview 페이지는 AppShell 바이패스
  if (pathname === '/preview') {
    return <>{children}</>;
  }

  // 비로그인 → 히어로 화면
  if (!isLoggedIn) {
    return (
      <div className="flex h-full pt-20">
        <main className="flex-1 min-w-0 overflow-y-auto bg-pearl-50">
          <div className="relative flex items-center justify-center min-h-full px-4">
            {/* 캐릭터들이 양쪽에 배치됨 — CTA 뒤 레이어 */}
            <HeroAnimation />

            {/* Center CTA — 가운데 최상단 */}
            <div className="relative z-20 text-center max-w-2xl">
              <img
                src="/loopdrop-icon.png"
                alt="LoopDrop"
                className="w-28 h-28 rounded-3xl mx-auto mb-6 shadow-xl"
                style={{ boxShadow: '0 12px 40px rgba(139, 92, 246, 0.35)' }}
              />
              <h1 className="text-6xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                  LoopDrop
                </span>
              </h1>
              <p className="text-2xl text-gray-500 mb-3">
                멀티플랫폼 콘텐츠 발행 커맨드 센터
              </p>
              <p className="text-base text-gray-400 mb-10">
                하나의 영상을 YouTube, Instagram, Threads, TikTok, X에<br />
                한 번에 발행하세요.
              </p>

              <div className="flex items-center justify-center gap-4 mb-10">
                {['YouTube', 'Instagram', 'Threads', 'TikTok', 'X'].map((name) => (
                  <div
                    key={name}
                    className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 text-base font-semibold hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50 transition-all cursor-pointer"
                  >
                    {name}
                  </div>
                ))}
              </div>

              <p className="text-sm text-violet-300">
                오른쪽 상단의 로그인 버튼으로 시작하세요
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 로그인 됨 → 정상 앱
  return (
    <div className="flex h-full pt-20">
      <Sidebar />
      <main className="flex-1 min-w-0 ml-72 overflow-y-auto bg-pearl-50 p-8 pb-16">
        {children}
      </main>
    </div>
  );
}
