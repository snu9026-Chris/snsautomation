export interface Scene {
  id: string;
  imageFile: File;
  imageUrl: string;
  caption: string;
  durationSec: number;
  order: number;
}

export interface MusicOption {
  id: string;
  name: string;
  url: string;
  builtIn: boolean;
}

export type Orientation = 'portrait' | 'landscape' | 'square';

export interface RenderSettings {
  width: number;
  height: number;
  fps: number;
  orientation: Orientation;
}

export interface RenderProgress {
  phase: 'idle' | 'loading' | 'rendering-frames' | 'encoding' | 'done' | 'error';
  percent: number;
  message: string;
  outputUrl?: string;
}

export const ORIENTATION_PRESETS: Record<Orientation, { width: number; height: number; label: string }> = {
  portrait: { width: 1080, height: 1920, label: '세로 9:16' },
  landscape: { width: 1920, height: 1080, label: '가로 16:9' },
  square: { width: 1080, height: 1080, label: '정사각 1:1' },
};

export const BUILT_IN_MUSIC: MusicOption[] = [
  { id: 'none', name: '음악 없음', url: '', builtIn: true },
];
