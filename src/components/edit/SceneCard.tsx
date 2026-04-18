'use client';

import { useState } from 'react';
import { GripVertical, X, Sparkles, Loader2, Clock } from 'lucide-react';
import type { Scene } from '@/lib/video-editor-types';
import clsx from 'clsx';

interface Props {
  scene: Scene;
  index: number;
  contentType?: string;
  contentDescription?: string;
  onUpdate: (id: string, updates: Partial<Scene>) => void;
  onDelete: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragTarget: boolean;
}

export default function SceneCard({
  scene, index, contentType, contentDescription, onUpdate, onDelete,
  onDragStart, onDragOver, onDragEnd, isDragTarget,
}: Props) {
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiOptions, setAiOptions] = useState<string[]>([]);

  const handleAiCaption = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDescription: contentDescription || scene.caption || scene.imageFile.name,
          contentType: contentType || 'daily',
        }),
      });
      const data = await res.json();
      if (data.captions?.length > 0) {
        onUpdate(scene.id, { caption: data.captions[0] });
        setAiOptions(data.captions);
      }
    } catch {
      console.error('AI caption failed');
    }
    setLoadingAi(false);
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDragEnd={onDragEnd}
      className={clsx(
        'flex items-start gap-3 p-3 rounded-xl border transition-all',
        isDragTarget
          ? 'border-indigo-400 bg-indigo-50/50'
          : 'border-gray-100 bg-white hover:border-gray-200'
      )}
    >
      {/* 드래그 핸들 */}
      <div className="cursor-grab active:cursor-grabbing pt-1 text-gray-300 hover:text-gray-400">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* 썸네일 */}
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={scene.imageUrl}
          alt={`Scene ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 입력 영역 */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">#{index + 1}</span>
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3 text-gray-300" />
            <input
              type="number"
              min={1}
              max={15}
              value={scene.durationSec}
              onChange={(e) => onUpdate(scene.id, { durationSec: Math.max(1, Math.min(15, Number(e.target.value))) })}
              className="w-12 border border-gray-200 rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-200"
            />
            <span className="text-xs text-gray-300">초</span>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={scene.caption}
            onChange={(e) => onUpdate(scene.id, { caption: e.target.value })}
            placeholder="자막을 입력하세요"
            maxLength={50}
            className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
          />
          <button
            onClick={handleAiCaption}
            disabled={loadingAi}
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500 hover:border-indigo-200 transition-all cursor-pointer disabled:opacity-40"
            title="AI 자막 추천"
          >
            {loadingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          </button>
        </div>

        {aiOptions.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {aiOptions.map((cap, i) => (
              <button
                key={i}
                onClick={() => onUpdate(scene.id, { caption: cap })}
                className={clsx(
                  'px-2 py-0.5 rounded text-xs border cursor-pointer transition-all truncate max-w-[200px]',
                  scene.caption === cap
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                )}
              >
                {cap}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 삭제 */}
      <button
        onClick={() => onDelete(scene.id)}
        className="text-gray-300 hover:text-red-400 cursor-pointer pt-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
