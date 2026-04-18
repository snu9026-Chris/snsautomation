'use client';

import { useState } from 'react';
import { PLATFORM_CONFIG } from '@/lib/constants';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginModal from '@/components/auth/LoginModal';
import type { PlatformId } from '@/types';
import { LogIn, LogOut } from 'lucide-react';

const platforms: PlatformId[] = ['youtube', 'instagram', 'threads', 'tiktok', 'x'];

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#FF0000">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7">
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function ThreadsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#000000">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.695 6.54 2.717 2.227-.017 4.07-.531 5.478-1.529 1.527-1.08 2.29-2.535 2.29-4.352 0-1.398-.508-2.518-1.512-3.328-.89-.718-2.084-1.146-3.452-1.259a.404.404 0 0 0-.04 0c.067.442.1.895.1 1.357 0 .245-.01.488-.03.727-.498 5.78-4.693 6.192-5.696 6.192-.105 0-.164-.002-.164-.002-1.765-.057-3.13-.705-3.934-1.869-.718-1.039-.925-2.358-.58-3.711.64-2.498 2.936-4.282 6.037-4.606.77-.08 1.537-.1 2.29-.063.04-.627.047-1.255.01-1.834-.097-1.446-.497-2.244-1.258-2.507a2.1 2.1 0 0 0-.702-.107c-1.042 0-2.376.63-2.464 3.262l-2.117-.04c.063-1.9.573-3.28 1.514-4.104.84-.733 1.947-1.118 3.209-1.118.495 0 .982.063 1.447.188 1.553.418 2.556 1.622 2.813 3.382.118.807.139 1.718.064 2.71a11.4 11.4 0 0 1 2.305.568c1.752.653 3.063 1.752 3.793 3.18.588 1.152.868 2.47.868 3.802 0 2.536-1.08 4.635-3.124 6.075C17.157 23.213 14.9 23.978 12.186 24zM8.935 15.653c-.205.801-.09 1.508.322 1.998.398.474 1.063.748 1.87.772.02 0 .04.001.061.001 1.196 0 3.264-.712 3.573-4.304a8.082 8.082 0 0 0-.015-.876c-.605-.024-1.226-.01-1.844.055-2.28.238-3.612 1.354-3.967 2.354z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="#00F2EA" />
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="#FF0050" style={{ transform: 'translate(-1px, 1px)' }} opacity="0.6" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#000000">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface MarqueeItem {
  id: PlatformId;
  icon: React.FC;
  name: string;
}

const marqueeItems: MarqueeItem[] = platforms.map((pid) => ({
  id: pid,
  icon: { youtube: YouTubeIcon, instagram: InstagramIcon, threads: ThreadsIcon, tiktok: TikTokIcon, x: XIcon }[pid],
  name: PLATFORM_CONFIG[pid].name,
}));

export default function Header() {
  const { isLoggedIn, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const repeatedItems = [...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-20 bg-white z-50 flex items-center justify-between px-8 header-pearl-border">
        <div className="flex items-center gap-3">
          <img src="/loopdrop-icon.png" alt="LoopDrop" className="w-10 h-10 rounded-xl" />
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            LoopDrop
          </span>
        </div>

        {/* 전광판 마키 — 가로 1/3 */}
        <div className="relative overflow-hidden h-12" style={{ width: 'calc((100vw - 240px) / 3)' }}>
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="marquee-track flex items-center gap-8 h-full">
            {repeatedItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.id}-${i}`}
                  className="flex items-center gap-2.5 shrink-0"
                >
                  <Icon />
                  <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 로그인/로그아웃 버튼 */}
        <div>
          {isLoggedIn ? (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all cursor-pointer border border-gray-200"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              로그인
            </button>
          )}
        </div>
      </header>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
