'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack } from 'lucide-react';
import type { Scene } from '@/lib/video-editor-types';
import clsx from 'clsx';

interface Props {
  scenes: Scene[];
}

export default function SlideshowPreview({ scenes }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scene = scenes[currentIndex];

  const advanceScene = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= scenes.length - 1) {
        setPlaying(false);
        return 0;
      }
      return prev + 1;
    });
  }, [scenes.length]);

  useEffect(() => {
    if (playing && scene) {
      timerRef.current = setTimeout(advanceScene, scene.durationSec * 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, currentIndex, scene, advanceScene]);

  useEffect(() => {
    if (currentIndex >= scenes.length) setCurrentIndex(Math.max(0, scenes.length - 1));
  }, [scenes.length, currentIndex]);

  const totalDuration = scenes.reduce((sum, s) => sum + s.durationSec, 0);

  if (scenes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-pearl-100 flex items-center justify-center mb-3">
          <Play className="w-6 h-6 text-gray-300" />
        </div>
        <p className="text-xs text-gray-300">이미지를 추가하면<br />프리뷰가 여기에 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 프리뷰 영역 */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-h-[420px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={scene?.imageUrl}
          alt={`Scene ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        {scene?.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
            <p className="text-white text-sm font-bold text-center leading-relaxed drop-shadow-lg">
              {scene.caption}
            </p>
          </div>
        )}
        {/* 장면 인디케이터 */}
        <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 px-4">
          {scenes.map((_, i) => (
            <div
              key={i}
              className={clsx(
                'h-0.5 rounded-full flex-1 transition-all cursor-pointer',
                i === currentIndex ? 'bg-white' : 'bg-white/30'
              )}
              onClick={() => { setCurrentIndex(i); setPlaying(false); }}
            />
          ))}
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurrentIndex(0); setPlaying(false); }}
            className="p-1.5 rounded-lg hover:bg-pearl-100 text-gray-400 cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPlaying(!playing)}
            className="p-1.5 rounded-lg hover:bg-pearl-100 text-gray-600 cursor-pointer"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
        <span className="text-xs text-gray-400">
          {currentIndex + 1}/{scenes.length} &middot; {totalDuration}초
        </span>
      </div>
    </div>
  );
}
