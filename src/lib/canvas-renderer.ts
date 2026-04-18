import type { Scene, RenderSettings } from './video-editor-types';

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let current = '';

  for (const char of text) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawImageCoverFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = canvasW / canvasH;

  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (imgRatio > canvasRatio) {
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / canvasRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function renderSceneToBlob(
  scene: Scene,
  settings: RenderSettings
): Promise<Blob> {
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = settings.width;
  canvas.height = settings.height;
  const ctx = canvas.getContext('2d')!;

  // 배경 검정
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, settings.width, settings.height);

  // 이미지 cover-fit
  const img = await loadImage(scene.imageUrl);
  drawImageCoverFit(ctx, img, settings.width, settings.height);

  // 자막이 있으면 하단 오버레이 + 텍스트
  if (scene.caption.trim()) {
    const fontSize = Math.round(settings.width * 0.042);
    const padding = Math.round(settings.width * 0.06);
    const lineHeight = fontSize * 1.5;

    ctx.font = `bold ${fontSize}px Pretendard, sans-serif`;
    const maxTextWidth = settings.width - padding * 2;
    const lines = wrapText(ctx, scene.caption, maxTextWidth);

    const textBlockHeight = lines.length * lineHeight + padding;
    const gradientHeight = textBlockHeight + padding;

    // 그라데이션 오버레이
    const gradient = ctx.createLinearGradient(
      0, settings.height - gradientHeight,
      0, settings.height
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.4, 'rgba(0,0,0,0.6)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, settings.height - gradientHeight, settings.width, gradientHeight);

    // 텍스트
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // 텍스트 그림자
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    const startY = settings.height - padding - (lines.length - 1) * lineHeight;
    lines.forEach((line, i) => {
      ctx.fillText(line, settings.width / 2, startY + i * lineHeight);
    });

    ctx.shadowColor = 'transparent';
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      'image/png'
    );
  });
}
