'use client';

import { useState, useRef, useCallback } from 'react';
import { ImageIcon, Loader2, Check, X } from 'lucide-react';
import clsx from 'clsx';

interface PickedPhoto {
  id: string;
  baseUrl: string;
  mimeType: string;
  fileName?: string;
}

interface Props {
  onPhotosSelected: (files: { name: string; url: string; type: 'image' | 'video' }[]) => void;
}

export default function GooglePhotoPicker({ onPhotosSelected }: Props) {
  const [state, setState] = useState<'idle' | 'opening' | 'waiting' | 'downloading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const pickerWindowRef = useRef<Window | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const handlePick = useCallback(async () => {
    setState('opening');
    setMessage('Google Photos 연결 중...');

    try {
      // 1. 세션 생성
      const sessionRes = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-session' }),
      });

      const session = await sessionRes.json();

      if (!sessionRes.ok || session.error) {
        setState('error');
        setMessage(session.error || '세션 생성 실패');
        return;
      }

      const { id: sessionId, pickerUri } = session;

      // 2. Google Photos 선택 창 열기
      const pickerUrl = `${pickerUri}/autoclose`;
      pickerWindowRef.current = window.open(pickerUrl, 'google-photos-picker', 'width=900,height=700');

      setState('waiting');
      setMessage('Google Photos에서 사진을 선택하세요...');

      // 3. 폴링
      const pollInterval = 3000;
      const maxPolls = 120; // 6분
      let pollCount = 0;

      pollingRef.current = setInterval(async () => {
        pollCount++;

        // 창이 닫혔는지 확인
        if (pickerWindowRef.current?.closed) {
          // 창 닫힘 — 선택 완료했을 수 있음
        }

        if (pollCount > maxPolls) {
          clearInterval(pollingRef.current!);
          setState('error');
          setMessage('시간 초과. 다시 시도해주세요.');
          return;
        }

        try {
          const pollRes = await fetch('/api/photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'poll-session', sessionId }),
          });

          const pollData = await pollRes.json();

          if (pollData.mediaItemsSet) {
            clearInterval(pollingRef.current!);

            // 4. 선택된 미디어 가져오기
            setState('downloading');
            setMessage('선택한 사진을 가져오는 중...');

            const mediaRes = await fetch('/api/photos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'get-media', sessionId }),
            });

            const mediaData = await mediaRes.json();
            const rawItems = mediaData.mediaItems || [];
            const items: PickedPhoto[] = rawItems.map((item: { id: string; mediaFile?: { baseUrl?: string; mimeType?: string; filename?: string }; baseUrl?: string; mimeType?: string }) => ({
              id: item.id,
              baseUrl: item.mediaFile?.baseUrl || item.baseUrl || '',
              mimeType: item.mediaFile?.mimeType || item.mimeType || 'image/jpeg',
              fileName: item.mediaFile?.filename,
            }));

            if (items.length === 0) {
              setState('idle');
              setMessage('');
              return;
            }

            // 5. 각 사진을 Supabase에 업로드
            setDownloadProgress({ current: 0, total: items.length });
            const uploadedFiles: { name: string; url: string; type: 'image' | 'video' }[] = [];

            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              setDownloadProgress({ current: i + 1, total: items.length });
              setMessage(`사진 업로드 중... (${i + 1}/${items.length})`);

              const isVideo = item.mimeType?.startsWith('video/');
              const ext = isVideo ? 'mp4' : 'jpg';
              const fileName = `google_photo_${Date.now()}_${i}.${ext}`;

              try {
                const dlRes = await fetch('/api/photos', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'download',
                    baseUrl: item.baseUrl,
                    fileName,
                    mimeType: item.mimeType,
                  }),
                });

                const dlData = await dlRes.json();
                if (dlData.url) {
                  uploadedFiles.push({
                    name: fileName,
                    url: dlData.url,
                    type: isVideo ? 'video' : 'image',
                  });
                }
              } catch {
                console.error(`Failed to download photo ${i}`);
              }
            }

            if (uploadedFiles.length > 0) {
              onPhotosSelected(uploadedFiles);
              setState('done');
              setMessage(`${uploadedFiles.length}장 가져오기 완료!`);
              setTimeout(() => { setState('idle'); setMessage(''); }, 3000);
            } else {
              setState('error');
              setMessage('사진 업로드에 실패했습니다.');
            }
          }
        } catch {
          // 폴링 에러는 무시하고 계속
        }
      }, pollInterval);
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : '오류 발생');
    }
  }, [onPhotosSelected]);

  const handleCancel = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (pickerWindowRef.current && !pickerWindowRef.current.closed) pickerWindowRef.current.close();
    setState('idle');
    setMessage('');
  };

  return (
    <div>
      {state === 'idle' && (
        <button
          onClick={handlePick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer w-full justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#4285F4"/>
            <path d="M2 17l10 5 10-5" stroke="#34A853" strokeWidth="2" fill="none"/>
            <path d="M2 12l10 5 10-5" stroke="#FBBC04" strokeWidth="2" fill="none"/>
          </svg>
          Google Photos에서 가져오기
        </button>
      )}

      {state !== 'idle' && (
        <div className={clsx(
          'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm',
          state === 'error' ? 'border-red-200 bg-red-50' :
          state === 'done' ? 'border-emerald-200 bg-emerald-50' :
          'border-indigo-200 bg-indigo-50'
        )}>
          {state === 'opening' || state === 'waiting' || state === 'downloading' ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
          ) : state === 'done' ? (
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <X className="w-4 h-4 text-red-500 shrink-0" />
          )}

          <span className={clsx(
            'flex-1',
            state === 'error' ? 'text-red-600' :
            state === 'done' ? 'text-emerald-600' :
            'text-indigo-600'
          )}>
            {message}
            {state === 'downloading' && downloadProgress.total > 0 && (
              <span className="ml-1 font-medium">
                ({downloadProgress.current}/{downloadProgress.total})
              </span>
            )}
          </span>

          {(state === 'waiting' || state === 'opening') && (
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
