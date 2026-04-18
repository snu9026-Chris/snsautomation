'use client';

import { useState, useEffect, useRef } from 'react';

// Lottie Player (dynamic import 방식 대신 dotlottie-react 사용)
function LottieAnimation({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animation: unknown;
    async function loadLottie() {
      try {
        const lottie = (await import('lottie-web')).default;
        if (containerRef.current) {
          animation = lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: src,
          });
        }
      } catch (e) {
        console.error('Lottie load failed:', e);
      }
    }
    loadLottie();
    return () => {
      if (animation && typeof (animation as { destroy: () => void }).destroy === 'function') {
        (animation as { destroy: () => void }).destroy();
      }
    };
  }, [src]);

  return <div ref={containerRef} className={className} style={style} />;
}

// 씬 데이터 — 각각 다른 Lottie 애니메이션 + 배경색 + 메시지
const SCENES = [
  {
    lottie: '/lottie/social-media.json',
    bgGradient: 'linear-gradient(135deg, #E0F2FE 0%, #BFDBFE 40%, transparent 100%)',
    bgColor: '#F0F9FF',
    label: '멀티플랫폼 발행',
    messages: [
      '5개 플랫폼에 한 번에 발행!',
      'YouTube, Instagram, TikTok, Threads, X',
      'AI가 플랫폼별 해시태그 추천',
    ],
  },
  {
    lottie: '/lottie/content.json',
    bgGradient: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 40%, transparent 100%)',
    bgColor: '#FFF1F2',
    label: '영상 편집',
    messages: [
      '사진으로 숏폼 영상 만들기!',
      'AI 자막 + 배경 음악 합성',
      '브라우저에서 바로 mp4 다운로드',
    ],
  },
  {
    lottie: '/lottie/mobile.json',
    bgGradient: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 40%, transparent 100%)',
    bgColor: '#F5F3FF',
    label: '예약 발행',
    messages: [
      '캘린더에서 예약 발행 관리',
      '매일 오전 9시 자동 발행',
      '한번 설정하면 알아서 올라가요',
    ],
  },
];

export default function PreviewPage() {
  const [msgIndices, setMsgIndices] = useState([0, 0, 0]);
  const [msgVisible, setMsgVisible] = useState([true, false, false]);

  useEffect(() => {
    const cleanups = SCENES.map((scene, i) => {
      const startDelay = setTimeout(() => {
        setMsgVisible(prev => { const n = [...prev]; n[i] = true; return n; });
      }, 1000 + i * 1500);

      const interval = setInterval(() => {
        setMsgVisible(prev => { const n = [...prev]; n[i] = false; return n; });
        setTimeout(() => {
          setMsgIndices(prev => {
            const n = [...prev]; n[i] = (n[i] + 1) % scene.messages.length; return n;
          });
          setMsgVisible(prev => { const n = [...prev]; n[i] = true; return n; });
        }, 500);
      }, 4500 + i * 500);

      return () => { clearTimeout(startDelay); clearInterval(interval); };
    });
    return () => cleanups.forEach(fn => fn());
  }, []);

  return (
    <div className="min-h-screen bg-pearl-50 flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Lottie 씬 카드 3개 */}
      {SCENES.map((scene, i) => {
        const msg = scene.messages[msgIndices[i]];
        const isVisible = msgVisible[i];

        const side = i === 0 ? 'left' : i === 1 ? 'right' : 'left';
        const positions = [
          { top: '5%', left: '2%' },
          { top: '8%', right: '2%' },
          { bottom: '5%', left: '4%' },
        ];

        return (
          <div
            key={i}
            className="absolute"
            style={{
              ...positions[i],
              width: '420px',
              height: '320px',
            }}
          >
            {/* 그라데이션 페이드 배경 — 바깥으로 녹아듦 */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: scene.bgGradient,
              }}
            />

            {/* 라벨 */}
            <div className="absolute top-4 left-5 z-10">
              <span className="text-xs font-semibold text-gray-500/70 uppercase tracking-wide">
                {scene.label}
              </span>
            </div>

            {/* Lottie 애니메이션 */}
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <LottieAnimation
                src={scene.lottie}
                className="w-full h-full"
                style={{ maxWidth: '300px', maxHeight: '250px' }}
              />
            </div>

            {/* 말풍선 */}
            <div
              className="absolute z-20 transition-all duration-400"
              style={{
                bottom: '16px',
                [side]: '16px',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.95)',
              }}
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg border border-white/80">
                <p className="text-sm font-semibold text-gray-700">{msg}</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* CTA 가운데 */}
      <div className="relative z-30 text-center max-w-lg">
        <img
          src="/loopdrop-icon.png"
          alt="LoopDrop"
          className="w-24 h-24 rounded-2xl mx-auto mb-6 shadow-xl"
          style={{ boxShadow: '0 12px 40px rgba(139, 92, 246, 0.35)' }}
        />
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            LoopDrop
          </span>
        </h1>
        <p className="text-xl text-gray-500 mb-3">
          멀티플랫폼 콘텐츠 발행 커맨드 센터
        </p>
        <p className="text-base text-gray-400 mb-10">
          하나의 영상을 YouTube, Instagram, Threads, TikTok, X에<br />
          한 번에 발행하세요.
        </p>

        <div className="flex items-center justify-center gap-3 mb-10">
          {['YouTube', 'Instagram', 'Threads', 'TikTok', 'X'].map((name) => (
            <div
              key={name}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-semibold hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50 transition-all cursor-pointer"
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
  );
}
