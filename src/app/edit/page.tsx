'use client';

import { useState, useRef, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SlideshowPreview from '@/components/edit/SlideshowPreview';
import SceneCard from '@/components/edit/SceneCard';
import MusicSelector from '@/components/edit/MusicSelector';
import type { MusicCrop } from '@/components/edit/MusicSelector';
import type { Scene, Orientation, RenderProgress } from '@/lib/video-editor-types';
import { ORIENTATION_PRESETS } from '@/lib/video-editor-types';
import { Upload, ImageIcon, Download, Loader2, Monitor, Smartphone, Square } from 'lucide-react';
import clsx from 'clsx';

let idCounter = 0;
function generateId() {
  return `scene_${Date.now()}_${idCounter++}`;
}

export default function EditPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [contentType, setContentType] = useState('daily');
  const [contentDescription, setContentDescription] = useState('');
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicCrop, setMusicCrop] = useState<MusicCrop>({ startSec: 0, endSec: 0 });
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [renderProgress, setRenderProgress] = useState<RenderProgress>({
    phase: 'idle', percent: 0, message: '',
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 이미지 추가
  const addImages = useCallback((files: FileList) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const newScenes: Scene[] = imageFiles.map((file, i) => ({
      id: generateId(),
      imageFile: file,
      imageUrl: URL.createObjectURL(file),
      caption: '',
      durationSec: 3,
      order: scenes.length + i,
    }));
    setScenes((prev) => [...prev, ...newScenes]);
  }, [scenes.length]);

  // 장면 업데이트/삭제
  const updateScene = useCallback((id: string, updates: Partial<Scene>) => {
    setScenes((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteScene = useCallback((id: string) => {
    setScenes((prev) => {
      const scene = prev.find((s) => s.id === id);
      if (scene) URL.revokeObjectURL(scene.imageUrl);
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  // 드래그 정렬
  const handleDragStart = useCallback((index: number) => setDragIndex(index), []);
  const handleDragOver = useCallback((index: number) => setDragOverIndex(index), []);
  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      setScenes((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(dragOverIndex, 0, moved);
        return next;
      });
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex]);

  // 렌더링
  const handleRender = async () => {
    if (scenes.length === 0) return;

    setRenderProgress({ phase: 'loading', percent: 0, message: 'ffmpeg 로드 중...' });

    try {
      const { encodeSlideshow } = await import('@/lib/ffmpeg-worker');
      const preset = ORIENTATION_PRESETS[orientation];

      await encodeSlideshow(
        scenes,
        musicFile,
        { width: preset.width, height: preset.height, fps: 30, orientation },
        setRenderProgress,
        musicFile ? musicCrop : undefined
      );
    } catch (err) {
      console.error('Render failed:', err);
      setRenderProgress({
        phase: 'error',
        percent: 0,
        message: err instanceof Error ? err.message : '렌더링 실패',
      });
    }
  };

  const handleDownload = () => {
    if (!renderProgress.outputUrl) return;
    const a = document.createElement('a');
    a.href = renderProgress.outputUrl;
    a.download = `loopdrop_${Date.now()}.mp4`;
    a.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) addImages(e.dataTransfer.files);
  };

  const totalDuration = scenes.reduce((sum, s) => sum + s.durationSec, 0);
  const isRendering = renderProgress.phase === 'loading' || renderProgress.phase === 'rendering-frames' || renderProgress.phase === 'encoding';

  return (
    <div className="pb-24">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">영상 편집</h1>

      {/* 상단: 이미지 업로드 + 프리뷰 */}
      <div className="flex gap-6 mb-6">
        {/* 왼쪽: 업로드 */}
        <Card className="flex-1 min-w-0">
          <h2 className="text-sm font-medium text-gray-500 mb-3">이미지 업로드</h2>

          {scenes.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {scenes.map((scene, idx) => (
                <div key={scene.id} className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={scene.imageUrl} alt={`${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs font-bold">{idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className={clsx(
              'border-2 border-dashed rounded-xl text-center transition-all duration-200 cursor-pointer p-8',
              isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-pearl-50'
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-1">
              {scenes.length > 0 ? '이미지 추가하기' : '이미지를 드래그하거나 클릭'}
            </p>
            <p className="text-xs text-gray-300">JPG, PNG, WEBP</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) addImages(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
        </Card>

        {/* 오른쪽: 프리뷰 */}
        <div className="w-64 shrink-0">
          <Card className="h-full">
            <h2 className="text-sm font-medium text-gray-500 mb-3">프리뷰</h2>
            <SlideshowPreview scenes={scenes} />
          </Card>
        </div>
      </div>

      {/* 콘텐츠 유형 + 설명 */}
      <Card className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">콘텐츠 유형</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { id: 'daily', label: '일상/브이로그', emoji: '📷' },
            { id: 'info', label: '정보/팁', emoji: '💡' },
            { id: 'promo', label: '홍보/광고', emoji: '📢' },
            { id: 'review', label: '리뷰/후기', emoji: '⭐' },
            { id: 'meme', label: '밈/유머', emoji: '😂' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setContentType(type.id)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border',
                contentType === type.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              )}
            >
              {type.emoji} {type.label}
            </button>
          ))}
        </div>

        <h2 className="text-sm font-medium text-gray-500 mb-2">영상 주제</h2>
        <p className="text-xs text-gray-400 mb-3">어떤 영상인지 설명하면 AI가 각 장면에 어울리는 짧은 자막을 추천합니다.</p>
        <textarea
          value={contentDescription}
          onChange={(e) => setContentDescription(e.target.value)}
          placeholder="예: 제주도 카페 투어, 봄날 벚꽃 산책, 새로 산 카메라 언박싱"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
        />

      </Card>

      {/* 장면 목록 */}
      {scenes.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500">
              장면 목록 ({scenes.length}개 &middot; 총 {totalDuration}초)
            </h2>
            <p className="text-xs text-gray-300">드래그로 순서 변경</p>
          </div>
          <div className="space-y-2">
            {scenes.map((scene, index) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                index={index}
                contentType={contentType}
                contentDescription={contentDescription}
                onUpdate={updateScene}
                onDelete={deleteScene}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                isDragTarget={dragOverIndex === index}
              />
            ))}
          </div>
        </Card>
      )}

      {/* 배경 음악 */}
      {scenes.length > 0 && (
        <Card className="mb-6">
          <MusicSelector
            musicFile={musicFile}
            musicCrop={musicCrop}
            totalVideoDuration={totalDuration}
            onMusicChange={setMusicFile}
            onCropChange={setMusicCrop}
          />
        </Card>
      )}

      {/* 렌더링 결과 */}
      {renderProgress.phase === 'done' && renderProgress.outputUrl && (
        <Card className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3">렌더링 완료</h2>
          <div className="flex gap-4 items-start">
            <video
              src={renderProgress.outputUrl}
              controls
              className="w-48 rounded-lg"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-3">
                {scenes.length}개 장면 &middot; {totalDuration}초 &middot; {ORIENTATION_PRESETS[orientation].label}
              </p>
              <Button variant="primary" onClick={handleDownload}>
                <Download className="w-4 h-4" />
                MP4 다운로드
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 하단 렌더링 바 */}
      <div className="fixed bottom-0 left-72 right-0 bg-white/80 backdrop-blur-sm border-t border-pearl-200 px-8 py-4 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 방향 선택 */}
            <div className="flex items-center gap-1.5">
              {([
                { key: 'portrait' as const, Icon: Smartphone, label: '세로' },
                { key: 'landscape' as const, Icon: Monitor, label: '가로' },
                { key: 'square' as const, Icon: Square, label: '정사각' },
              ]).map(({ key, Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setOrientation(key)}
                  disabled={isRendering}
                  className={clsx(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all',
                    orientation === key
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* 상태 텍스트 */}
            <div className="text-sm text-gray-500">
              {isRendering ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>{renderProgress.message}</span>
                  <span className="text-indigo-500 font-medium">{renderProgress.percent}%</span>
                </div>
              ) : renderProgress.phase === 'error' ? (
                <span className="text-red-400">{renderProgress.message}</span>
              ) : scenes.length > 0 ? (
                <span>{scenes.length}개 장면 &middot; {totalDuration}초</span>
              ) : (
                <span className="text-gray-300">이미지를 추가하세요</span>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={scenes.length === 0 || isRendering}
            onClick={handleRender}
          >
            {isRendering ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 렌더링 중...</>
            ) : (
              <><ImageIcon className="w-4 h-4" /> 영상 만들기</>
            )}
          </Button>
        </div>

        {/* 진행률 바 */}
        {isRendering && (
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
              style={{ width: `${renderProgress.percent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
