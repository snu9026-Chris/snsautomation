'use client';

import { useEffect, useState } from 'react';

// --- Modern Flat Illustration Influencers ---
function InfluencerGirl1() {
  return (
    <svg width="120" height="200" viewBox="0 0 120 200" fill="none">
      {/* Hair back */}
      <path d="M35 35 Q30 10 60 5 Q90 10 85 35 Q88 60 82 80 L38 80 Q32 60 35 35Z" fill="url(#hair1)"/>
      {/* Face */}
      <ellipse cx="60" cy="42" rx="22" ry="24" fill="#FDDCB5"/>
      {/* Blush */}
      <circle cx="44" cy="48" r="4" fill="#FFB3B3" opacity="0.4"/>
      <circle cx="76" cy="48" r="4" fill="#FFB3B3" opacity="0.4"/>
      {/* Eyes */}
      <ellipse cx="50" cy="40" rx="3.5" ry="4.5" fill="#2D1B12"/>
      <ellipse cx="70" cy="40" rx="3.5" ry="4.5" fill="#2D1B12"/>
      <circle cx="51.5" cy="38.5" r="1.5" fill="white"/>
      <circle cx="71.5" cy="38.5" r="1.5" fill="white"/>
      {/* Eyebrows */}
      <path d="M45 33 Q50 30 55 33" stroke="#5C3D2E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M65 33 Q70 30 75 33" stroke="#5C3D2E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Lips */}
      <path d="M54 52 Q60 57 66 52" stroke="#E8847C" strokeWidth="2" fill="#E8847C" opacity="0.6" strokeLinecap="round"/>
      {/* Hair front */}
      <path d="M35 35 Q38 20 60 15 Q82 20 85 35 Q80 30 72 28 Q68 35 60 34 Q52 35 48 28 Q40 30 35 35Z" fill="url(#hair1)"/>
      {/* Hair strands */}
      <path d="M38 35 Q32 50 30 75" stroke="#4A2C1A" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M82 35 Q88 50 90 75" stroke="#4A2C1A" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* Body - trendy crop top */}
      <path d="M42 66 Q38 72 36 90 L44 92 L46 78 L60 74 L74 78 L76 92 L84 90 Q82 72 78 66Z" fill="url(#top1)"/>
      {/* Neckline detail */}
      <path d="M50 66 Q60 72 70 66" stroke="#7C3AED" strokeWidth="1" fill="none"/>
      {/* Arms */}
      <path d="M36 74 Q28 82 22 88 Q20 90 24 94 Q30 88 38 82" fill="#FDDCB5"/>
      <path d="M84 74 Q88 78 86 86" stroke="#FDDCB5" strokeWidth="8" fill="none" strokeLinecap="round"/>
      {/* Phone in hand */}
      <rect x="80" y="80" width="16" height="26" rx="4" fill="#1F1F2E" stroke="#444" strokeWidth="0.5"/>
      <rect x="82" y="83" width="12" height="20" rx="2" fill="#C4B5FD"/>
      <circle cx="88" cy="96" r="2" fill="#8B5CF6" opacity="0.5"/>
      {/* Skirt */}
      <path d="M36 90 Q34 110 30 130 L90 130 Q86 110 84 90Z" fill="#374151"/>
      {/* Legs */}
      <path d="M42 130 L40 170 Q40 176 46 176 L52 176 Q54 176 54 172 L50 130Z" fill="#FDDCB5"/>
      <path d="M66 130 L68 170 Q68 176 74 176 L80 176 Q82 176 80 172 L76 130Z" fill="#FDDCB5"/>
      {/* Shoes */}
      <path d="M38 172 Q36 178 42 180 L54 180 Q58 178 56 174Z" fill="url(#top1)"/>
      <path d="M66 172 Q64 178 70 180 L82 180 Q86 178 84 174Z" fill="url(#top1)"/>
      <defs>
        <linearGradient id="hair1" x1="60" y1="0" x2="60" y2="80">
          <stop offset="0%" stopColor="#6B3A2A"/>
          <stop offset="100%" stopColor="#3D1F11"/>
        </linearGradient>
        <linearGradient id="top1" x1="40" y1="66" x2="80" y2="92">
          <stop offset="0%" stopColor="#8B5CF6"/>
          <stop offset="100%" stopColor="#6D28D9"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function InfluencerGuy1() {
  return (
    <svg width="110" height="190" viewBox="0 0 110 190" fill="none">
      {/* Hair */}
      <path d="M32 30 Q30 8 55 4 Q80 8 78 30 Q76 24 55 20 Q34 24 32 30Z" fill="#1A1A2E"/>
      <path d="M30 28 Q32 15 55 12 Q78 15 80 28 Q78 35 76 28 Q72 20 55 18 Q38 20 34 28 Q32 35 30 28Z" fill="#2D2D4E"/>
      {/* Face */}
      <ellipse cx="55" cy="38" rx="24" ry="22" fill="#F0C8A0"/>
      {/* Eyes */}
      <ellipse cx="46" cy="36" rx="3" ry="3.5" fill="#1A1A2E"/>
      <ellipse cx="64" cy="36" rx="3" ry="3.5" fill="#1A1A2E"/>
      <circle cx="47.5" cy="35" r="1.2" fill="white"/>
      <circle cx="65.5" cy="35" r="1.2" fill="white"/>
      {/* Eyebrows */}
      <path d="M41 30 Q46 27 51 30" stroke="#1A1A2E" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M59 30 Q64 27 69 30" stroke="#1A1A2E" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Smile */}
      <path d="M48 45 Q55 50 62 45" stroke="#B8916B" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Body - hoodie */}
      <path d="M35 58 Q28 65 25 95 L40 95 L42 72 L55 68 L68 72 L70 95 L85 95 Q82 65 75 58Z" fill="url(#hoodie1)"/>
      {/* Hoodie pocket */}
      <rect x="40" y="80" width="30" height="10" rx="5" fill="#2563EB" opacity="0.3"/>
      {/* Hood strings */}
      <line x1="48" y1="60" x2="46" y2="72" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="62" y1="60" x2="64" y2="72" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Arms */}
      <path d="M25 68 Q18 78 16 86" stroke="#3B82F6" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <path d="M85 68 Q90 75 88 84" stroke="#3B82F6" strokeWidth="10" fill="none" strokeLinecap="round"/>
      {/* Hand with phone */}
      <circle cx="16" cy="88" r="5" fill="#F0C8A0"/>
      <rect x="8" y="82" width="14" height="24" rx="3" fill="#1F1F2E"/>
      <rect x="10" y="85" width="10" height="18" rx="2" fill="#FCA5A5"/>
      {/* Pants */}
      <rect x="35" y="95" width="14" height="50" rx="7" fill="#374151"/>
      <rect x="61" y="95" width="14" height="50" rx="7" fill="#374151"/>
      {/* Shoes */}
      <ellipse cx="42" cy="148" rx="12" ry="5" fill="#1F1F2E"/>
      <ellipse cx="68" cy="148" rx="12" ry="5" fill="#1F1F2E"/>
      <defs>
        <linearGradient id="hoodie1" x1="30" y1="58" x2="80" y2="95">
          <stop offset="0%" stopColor="#3B82F6"/>
          <stop offset="100%" stopColor="#2563EB"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function InfluencerGirl2() {
  return (
    <svg width="115" height="195" viewBox="0 0 115 195" fill="none">
      {/* Long hair back */}
      <path d="M30 30 Q28 8 58 3 Q88 8 86 30 Q90 55 88 100 L28 100 Q26 55 30 30Z" fill="url(#hair2)"/>
      {/* Face */}
      <ellipse cx="58" cy="40" rx="23" ry="24" fill="#FFE0C2"/>
      {/* Blush */}
      <circle cx="42" cy="46" r="4.5" fill="#FFB3B3" opacity="0.35"/>
      <circle cx="74" cy="46" r="4.5" fill="#FFB3B3" opacity="0.35"/>
      {/* Eyes - bigger anime style */}
      <ellipse cx="48" cy="38" rx="4" ry="5" fill="#2D1B12"/>
      <ellipse cx="68" cy="38" rx="4" ry="5" fill="#2D1B12"/>
      <circle cx="49.5" cy="36.5" r="2" fill="white"/>
      <circle cx="69.5" cy="36.5" r="2" fill="white"/>
      <circle cx="47" cy="39" r="0.8" fill="white" opacity="0.6"/>
      <circle cx="67" cy="39" r="0.8" fill="white" opacity="0.6"/>
      {/* Eyelashes */}
      <path d="M43 33 Q48 31 53 34" stroke="#2D1B12" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M63 34 Q68 31 73 33" stroke="#2D1B12" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Lips */}
      <path d="M52 52 Q58 56 64 52" stroke="#E57373" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Hair front bangs */}
      <path d="M30 30 Q35 18 58 12 Q81 18 86 30 Q80 26 70 28 Q65 22 58 24 Q51 22 46 28 Q36 26 30 30Z" fill="url(#hair2)"/>
      {/* Body - stylish top */}
      <path d="M38 64 Q34 70 32 92 L42 92 L44 76 L58 72 L72 76 L74 92 L84 92 Q82 70 78 64Z" fill="url(#top2)"/>
      {/* Collar detail */}
      <path d="M46 64 L58 70 L70 64" stroke="#EC4899" strokeWidth="1.5" fill="none"/>
      {/* Arms */}
      <path d="M32 74 Q24 82 20 90" stroke="#FFE0C2" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M84 74 Q90 80 92 88" stroke="#FFE0C2" strokeWidth="8" fill="none" strokeLinecap="round"/>
      {/* Camera in hand */}
      <rect x="86" y="82" width="18" height="14" rx="3" fill="#374151"/>
      <circle cx="95" cy="89" r="4" fill="#1F1F2E" stroke="#6B7280" strokeWidth="1"/>
      <circle cx="95" cy="89" r="2" fill="#3B82F6"/>
      <rect x="90" y="80" width="6" height="3" rx="1" fill="#6B7280"/>
      {/* Skirt */}
      <path d="M32 92 Q28 115 24 135 L92 135 Q88 115 84 92Z" fill="#EC4899"/>
      <path d="M32 92 Q58 100 84 92" stroke="#DB2777" strokeWidth="1" fill="none"/>
      {/* Legs */}
      <path d="M40 135 L38 168" stroke="#FFE0C2" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <path d="M76 135 L78 168" stroke="#FFE0C2" strokeWidth="10" fill="none" strokeLinecap="round"/>
      {/* Heels */}
      <path d="M30 166 Q32 174 40 174 L46 174 Q48 172 44 168Z" fill="#EC4899"/>
      <path d="M70 166 Q72 174 80 174 L86 174 Q88 172 84 168Z" fill="#EC4899"/>
      <defs>
        <linearGradient id="hair2" x1="58" y1="0" x2="58" y2="100">
          <stop offset="0%" stopColor="#F59E0B"/>
          <stop offset="100%" stopColor="#D97706"/>
        </linearGradient>
        <linearGradient id="top2" x1="40" y1="64" x2="80" y2="92">
          <stop offset="0%" stopColor="#F472B6"/>
          <stop offset="100%" stopColor="#EC4899"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// --- SNS Logo Icons ---
function InstagramLogo() {
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
    </div>
  );
}
function YouTubeLogo() {
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-600">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    </div>
  );
}
function TikTokLogo() {
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-black">
      <svg width="14" height="16" viewBox="0 0 448 512" fill="white"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>
    </div>
  );
}
function ThreadsLogo() {
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-black">
      <svg width="14" height="16" viewBox="0 0 448 512" fill="white"><path d="M331.5 235.7c2.2.9 4.2 1.9 6.3 2.8c29.2 14.1 50.6 35.2 61.8 61.4c15.7 36.9 17.9 110.8-16.7 152.1c-35.9 43-105.7 44.9-152.1 15.8c-27.4-17.2-46-45.8-52.7-74.5c-1.4-5.9-2.3-12-2.9-18.1l-2.7.1c-30 1-56.4-3.8-78.6-14.2c-37-17.4-58.6-47.4-62.7-85.7c-2.8-26.1.3-51 8.7-75.2c11.2-32.4 30.1-60.8 55.4-83.4c31.5-28.1 69.2-46 111.4-52.9c42.5-6.9 84.6-4.2 124.4 14.8c42.8 20.4 73.7 53.5 89.7 99.3l-66.8 19.2c-9.7-27.8-27.2-48-52.7-59.5c-31.3-14.2-64.5-15.6-98.2-8.1c-42.7 9.5-72.8 34.4-87.5 75.5c-7.3 20.3-9.4 41.3-5.6 62.7c6.7 37.8 36.8 62.6 78.6 64.8c22.6 1.2 44.4-2.3 65.4-11.4c16.9-7.3 30.4-18.7 38.5-35.6c4.4-9.1 6.3-18.8 5.7-29c-.7-11.6-4.8-21.7-13.4-29.3c-5.2-4.6-11.5-7.4-18.4-8.8c1 8 1.4 16 .7 24.2c-1.7 20.3-10.1 37.3-26 49.4c-16.4 12.5-35 17.5-55.5 16.1c-26.6-1.9-48.8-15.5-58.6-41.9c-5.3-14.3-5.9-29-1.8-43.7c7.3-26.2 26.4-42.4 52.8-48.5c10.4-2.4 20.9-3 31.5-2.5l.2 0c10.1.4 19.6 2.3 28.8 5.7zM277.4 383.2c13-3.7 22.4-12.5 26.2-25.7c2-7 2.3-14.2 1-21.3l-1.7.5c-18.1 5.4-35.3 7-53 4.3c-11.3-1.7-20-7.1-25.4-17.5c-3.4-6.5-4.2-13.5-2.5-20.8c3.3-14.4 14-22.2 28.5-23.2c14.8-1 27.7 4 38.6 13.4c3.7 3.2 6.9 6.9 10.4 10.8c1.5-7 .8-13.5-1.8-19.8c-6-14.6-17.7-22.5-32.8-25.1c-20.4-3.5-39.1.5-55.6 12.5c-12.2 8.9-19.5 20.9-21.7 35.6c-2 13.2-.1 25.8 6.5 37.5c10.1 17.8 25.8 27.4 46.2 29.5c12.6 1.3 24.8-.1 37.1-4.9z"/></svg>
    </div>
  );
}
function XLogo() {
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-black">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    </div>
  );
}

// 각 캐릭터가 순환할 말풍선 메시지
const BUBBLE_SETS = [
  [
    { logo: <InstagramLogo />, title: 'Instagram 릴스', status: '업로드 완료!' },
    { logo: <ThreadsLogo />, title: 'Threads 포스트', status: '발행 성공!' },
    { logo: <YouTubeLogo />, title: 'YouTube Shorts', status: '예약 발행 중...' },
  ],
  [
    { logo: <YouTubeLogo />, title: 'YouTube Shorts', status: '발행 성공!' },
    { logo: <TikTokLogo />, title: 'TikTok 영상', status: '자동 업로드!' },
    { logo: <XLogo />, title: 'X 포스트', status: '포스팅 완료!' },
  ],
  [
    { logo: <TikTokLogo />, title: 'TikTok 영상', status: '5개 플랫폼 동시!' },
    { logo: <InstagramLogo />, title: 'AI 추천', status: '자막 생성 완료!' },
    { logo: <YouTubeLogo />, title: '예약 발행', status: '매일 오전 9시' },
  ],
];

const INFLUENCERS = [InfluencerGirl1, InfluencerGuy1, InfluencerGirl2];

// 걸어다니는 경로: top 위치 + 좌우 이동 범위
const WALK_CONFIGS = [
  { top: '20%', startX: 8, endX: 28, duration: 12, direction: 1 },   // 왼쪽 영역
  { top: '15%', startX: 68, endX: 88, duration: 14, direction: -1 }, // 오른쪽 영역
  { top: '55%', startX: 10, endX: 25, duration: 11, direction: 1 },  // 왼쪽 아래
];

export default function HeroAnimation() {
  const [bubbleIndices, setBubbleIndices] = useState([0, 0, 0]);
  const [bubbleVisible, setBubbleVisible] = useState([true, false, false]);

  useEffect(() => {
    // 각 캐릭터의 말풍선을 시차적으로 순환
    const intervals = INFLUENCERS.map((_, i) => {
      // 초기 지연
      const startDelay = setTimeout(() => {
        setBubbleVisible(prev => { const n = [...prev]; n[i] = true; return n; });
      }, 500 + i * 1200);

      const interval = setInterval(() => {
        // 사라짐
        setBubbleVisible(prev => { const n = [...prev]; n[i] = false; return n; });
        setTimeout(() => {
          // 다음 메시지 + 나타남
          setBubbleIndices(prev => {
            const n = [...prev];
            n[i] = (n[i] + 1) % BUBBLE_SETS[i].length;
            return n;
          });
          setBubbleVisible(prev => { const n = [...prev]; n[i] = true; return n; });
        }, 500);
      }, 4000 + i * 800);

      return () => { clearTimeout(startDelay); clearInterval(interval); };
    });

    return () => intervals.forEach(fn => fn());
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Soft glow circles */}
      <div className="absolute w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)', top: '15%', left: '10%' }} />
      <div className="absolute w-48 h-48 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #EC4899, transparent)', bottom: '20%', right: '15%' }} />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div key={`p-${i}`} className="absolute rounded-full"
          style={{
            width: `${3 + (i % 3) * 2}px`, height: `${3 + (i % 3) * 2}px`,
            background: i % 2 === 0 ? 'rgba(139,92,246,0.15)' : 'rgba(236,72,153,0.12)',
            top: `${10 + (i * 13) % 75}%`, left: `${5 + (i * 17) % 90}%`,
            animation: `heroParticle ${4 + i * 0.5}s ease-in-out ${i * 0.4}s infinite`,
          }}
        />
      ))}

      {/* Walking influencers */}
      {INFLUENCERS.map((Inf, i) => {
        const cfg = WALK_CONFIGS[i];
        const bubble = BUBBLE_SETS[i][bubbleIndices[i]];
        const isVisible = bubbleVisible[i];

        return (
          <div
            key={i}
            className="absolute"
            style={{
              top: cfg.top,
              animation: `heroWalk${i} ${cfg.duration}s ease-in-out infinite`,
            }}
          >
            {/* 말풍선 */}
            <div
              className="absolute whitespace-nowrap z-10"
              style={{
                top: '-68px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <div
                className="transition-all duration-400 ease-out"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.9)',
                }}
              >
                <div className="bg-white rounded-2xl px-3.5 py-2.5 shadow-xl shadow-violet-100/50 flex items-center gap-2.5 border border-violet-100/60">
                  {bubble.logo}
                  <div>
                    <div className="text-xs font-semibold text-gray-700">{bubble.title}</div>
                    <div className="text-xs font-medium text-violet-500">✓ {bubble.status}</div>
                  </div>
                </div>
                <div className="w-3 h-1.5 mx-auto" style={{ background: 'white', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
              </div>
            </div>

            {/* 캐릭터 (걸을 때 좌우 반전) */}
            <div style={{
              filter: 'drop-shadow(0 6px 20px rgba(139,92,246,0.12))',
              animation: `heroBounce ${0.6}s ease-in-out infinite`,
              transform: cfg.direction < 0 ? 'scaleX(-1)' : 'none',
            }}>
              <Inf />
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes heroWalk0 {
          0%, 100% { left: ${WALK_CONFIGS[0].startX}%; }
          50% { left: ${WALK_CONFIGS[0].endX}%; }
        }
        @keyframes heroWalk1 {
          0%, 100% { left: ${WALK_CONFIGS[1].startX}%; }
          50% { left: ${WALK_CONFIGS[1].endX}%; }
        }
        @keyframes heroWalk2 {
          0%, 100% { left: ${WALK_CONFIGS[2].startX}%; }
          50% { left: ${WALK_CONFIGS[2].endX}%; }
        }
        @keyframes heroBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes heroParticle {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-18px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
