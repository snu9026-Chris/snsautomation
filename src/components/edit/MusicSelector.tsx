'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Music, Upload, Play, Pause, Scissors } from 'lucide-react';
import clsx from 'clsx';

export interface MusicCrop {
  startSec: number;
  endSec: number;
}

interface Props {
  musicFile: File | null;
  musicCrop: MusicCrop;
  totalVideoDuration: number;
  onMusicChange: (file: File | null) => void;
  onCropChange: (crop: MusicCrop) => void;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MusicSelector({
  musicFile, musicCrop, totalVideoDuration, onMusicChange, onCropChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const animRef = useRef<number>(0);

  // 파일 변경 시 오디오 URL 생성
  useEffect(() => {
    if (musicFile) {
      const url = URL.createObjectURL(musicFile);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(null);
    }
  }, [musicFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onMusicChange(file);
      onCropChange({ startSec: 0, endSec: 0 }); // 리셋, endSec=0은 "전체"
    }
    e.target.value = '';
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      setDuration(dur);
      if (musicCrop.endSec === 0) {
        onCropChange({ startSec: 0, endSec: Math.min(dur, totalVideoDuration || dur) });
      }
    }
  };

  const tick = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      // 크롭 끝 지점에서 정지
      if (musicCrop.endSec > 0 && audioRef.current.currentTime >= musicCrop.endSec) {
        audioRef.current.pause();
        setPlaying(false);
        return;
      }
    }
    animRef.current = requestAnimationFrame(tick);
  }, [musicCrop.endSec]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      cancelAnimationFrame(animRef.current);
      setPlaying(false);
    } else {
      audioRef.current.currentTime = musicCrop.startSec;
      audioRef.current.play();
      animRef.current = requestAnimationFrame(tick);
      setPlaying(true);
    }
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // 크롭 영역의 비율 계산
  const cropStartPct = duration > 0 ? (musicCrop.startSec / duration) * 100 : 0;
  const cropEndPct = duration > 0 ? ((musicCrop.endSec || duration) / duration) * 100 : 100;
  const cropDuration = (musicCrop.endSec || duration) - musicCrop.startSec;
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
        <Music className="w-4 h-4" />
        배경 음악
      </h2>

      <div className="flex gap-3 mb-3">
        <button
          onClick={() => { onMusicChange(null); setPlaying(false); }}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-all',
            !musicFile
              ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
              : 'border-gray-200 text-gray-400 hover:border-gray-300'
          )}
        >
          음악 없음
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-all',
            musicFile
              ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
              : 'border-gray-200 text-gray-400 hover:border-gray-300'
          )}
        >
          <Upload className="w-3.5 h-3.5" />
          {musicFile ? musicFile.name : '음악 파일 선택'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* 크롭 + 미리듣기 UI */}
      {musicFile && audioUrl && (
        <div className="mt-3 p-4 bg-pearl-50 rounded-xl border border-gray-100 space-y-3">
          <audio
            ref={audioRef}
            src={audioUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setPlaying(false)}
            className="hidden"
          />

          {/* 상단: 재생 + 시간 정보 */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex items-center justify-center cursor-pointer hover:shadow-md transition-all shrink-0"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 font-medium truncate">{musicFile.name}</p>
              <p className="text-xs text-gray-400">
                전체 {formatTime(duration)} &middot;
                사용 구간 <span className="text-indigo-500 font-medium">{formatTime(cropDuration)}</span>
                {totalVideoDuration > 0 && (
                  <span> &middot; 영상 {totalVideoDuration}초</span>
                )}
              </p>
            </div>
            <Scissors className="w-4 h-4 text-gray-300 shrink-0" />
          </div>

          {/* 파형 대체 — 크롭 바 */}
          <div className="relative">
            {/* 트랙 배경 */}
            <div className="h-10 bg-gray-200 rounded-lg relative overflow-hidden">
              {/* 선택 영역 */}
              <div
                className="absolute top-0 bottom-0 bg-indigo-100 border-l-2 border-r-2 border-indigo-400"
                style={{
                  left: `${cropStartPct}%`,
                  width: `${cropEndPct - cropStartPct}%`,
                }}
              />
              {/* 재생 위치 */}
              {playing && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-indigo-600 z-10"
                  style={{ left: `${playheadPct}%` }}
                />
              )}
              {/* 시각적 파형 느낌 — 간단한 막대들 */}
              <div className="absolute inset-0 flex items-center px-1 gap-[2px]">
                {Array.from({ length: 60 }).map((_, i) => {
                  const h = 20 + Math.sin(i * 0.8) * 30 + Math.cos(i * 1.3) * 20;
                  const inCrop = (i / 60) * 100 >= cropStartPct && (i / 60) * 100 <= cropEndPct;
                  return (
                    <div
                      key={i}
                      className={clsx(
                        'flex-1 rounded-full transition-colors',
                        inCrop ? 'bg-indigo-400/60' : 'bg-gray-300/60'
                      )}
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* 시간 레이블 */}
            <div className="flex justify-between mt-1 text-xs text-gray-300">
              <span>0:00</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 크롭 슬라이더 */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">시작 지점</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, (musicCrop.endSec || duration) - 1)}
                  step={0.5}
                  value={musicCrop.startSec}
                  onChange={(e) => onCropChange({ ...musicCrop, startSec: Number(e.target.value) })}
                  className="flex-1 accent-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-gray-500 w-10 text-right font-mono">{formatTime(musicCrop.startSec)}</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">끝 지점</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={musicCrop.startSec + 1}
                  max={duration}
                  step={0.5}
                  value={musicCrop.endSec || duration}
                  onChange={(e) => onCropChange({ ...musicCrop, endSec: Number(e.target.value) })}
                  className="flex-1 accent-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-gray-500 w-10 text-right font-mono">{formatTime(musicCrop.endSec || duration)}</span>
              </div>
            </div>
          </div>

          {/* 영상 길이에 맞추기 버튼 */}
          {totalVideoDuration > 0 && duration > 0 && (
            <button
              onClick={() => {
                const end = Math.min(musicCrop.startSec + totalVideoDuration, duration);
                onCropChange({ ...musicCrop, endSec: end });
              }}
              className="text-xs text-indigo-500 hover:text-indigo-600 cursor-pointer transition-colors"
            >
              영상 길이({totalVideoDuration}초)에 맞추기
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-300 mt-2">MP3, WAV, AAC 등 지원. 선택한 구간만 영상에 포함됩니다.</p>
    </div>
  );
}
