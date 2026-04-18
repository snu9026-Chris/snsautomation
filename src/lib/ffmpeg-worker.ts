import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Scene, RenderSettings, RenderProgress } from './video-editor-types';
import { renderSceneToBlob } from './canvas-renderer';

let ffmpeg: FFmpeg | null = null;

async function getFFmpeg(onProgress: (p: RenderProgress) => void): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg;

  onProgress({ phase: 'loading', percent: 0, message: 'ffmpeg 로드 중...' });

  ffmpeg = new FFmpeg();

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

export interface MusicCropOptions {
  startSec: number;
  endSec: number;
}

export async function encodeSlideshow(
  scenes: Scene[],
  musicFile: File | null,
  settings: RenderSettings,
  onProgress: (p: RenderProgress) => void,
  musicCrop?: MusicCropOptions
): Promise<string> {
  const ff = await getFFmpeg(onProgress);

  // 1. 각 장면을 Canvas로 렌더링 → ffmpeg 가상 FS에 저장
  for (let i = 0; i < scenes.length; i++) {
    onProgress({
      phase: 'rendering-frames',
      percent: Math.round((i / scenes.length) * 50),
      message: `프레임 생성 중... (${i + 1}/${scenes.length})`,
    });

    const blob = await renderSceneToBlob(scenes[i], settings);
    const data = new Uint8Array(await blob.arrayBuffer());
    await ff.writeFile(`scene_${i}.png`, data);
  }

  // 2. concat 파일 생성 (각 이미지의 duration 지정)
  let concatContent = '';
  scenes.forEach((scene, i) => {
    concatContent += `file 'scene_${i}.png'\n`;
    concatContent += `duration ${scene.durationSec}\n`;
  });
  // ffmpeg concat 마지막 프레임 유지를 위해 마지막 이미지 반복
  concatContent += `file 'scene_${scenes.length - 1}.png'\n`;

  await ff.writeFile('list.txt', new TextEncoder().encode(concatContent));

  // 3. 음악 파일 처리
  if (musicFile) {
    const musicData = await fetchFile(musicFile);
    await ff.writeFile('audio.mp3', musicData);
  }

  // 4. 인코딩
  onProgress({ phase: 'encoding', percent: 50, message: '영상 인코딩 중...' });

  ff.on('progress', ({ progress }) => {
    const pct = Math.min(50 + Math.round(progress * 50), 99);
    onProgress({ phase: 'encoding', percent: pct, message: '영상 인코딩 중...' });
  });

  const ffmpegArgs = [
    '-f', 'concat',
    '-safe', '0',
    '-i', 'list.txt',
  ];

  if (musicFile) {
    // 크롭 구간 적용: -ss (시작) -t (길이)
    if (musicCrop && musicCrop.startSec > 0) {
      ffmpegArgs.push('-ss', String(musicCrop.startSec));
    }
    ffmpegArgs.push('-i', 'audio.mp3');
    if (musicCrop && musicCrop.endSec > 0) {
      const cropLen = musicCrop.endSec - (musicCrop.startSec || 0);
      ffmpegArgs.push('-t', String(cropLen));
    }
  }

  ffmpegArgs.push(
    '-vf', `fps=${settings.fps},scale=${settings.width}:${settings.height}`,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
  );

  if (musicFile) {
    ffmpegArgs.push('-c:a', 'aac', '-shortest');
  }

  ffmpegArgs.push('-y', 'output.mp4');

  await ff.exec(ffmpegArgs);

  // 5. 결과 파일 읽기
  const outputData = await ff.readFile('output.mp4');
  const outputBlob = new Blob([new Uint8Array(outputData as Uint8Array)], { type: 'video/mp4' });
  const outputUrl = URL.createObjectURL(outputBlob);

  // 정리
  for (let i = 0; i < scenes.length; i++) {
    await ff.deleteFile(`scene_${i}.png`).catch(() => {});
  }
  await ff.deleteFile('list.txt').catch(() => {});
  await ff.deleteFile('output.mp4').catch(() => {});
  if (musicFile) await ff.deleteFile('audio.mp3').catch(() => {});

  onProgress({ phase: 'done', percent: 100, message: '완료!', outputUrl });

  return outputUrl;
}
