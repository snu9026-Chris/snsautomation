'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PlatformIcon from '@/components/icons/PlatformIcon';
import PlatformPreview from '@/components/publish/PlatformPreview';
import { PLATFORM_CONFIG } from '@/lib/constants';
import { getPlatforms } from '@/lib/queries';
import { mockAiRecommendations } from '@/data/mock';
import type { PlatformId, Platform } from '@/types';
import { Upload, Sparkles, Send, X, FileVideo, ImageIcon, Loader2, ChevronDown, Info } from 'lucide-react';
import clsx from 'clsx';

interface UploadedFile {
  name: string;
  size: string;
  type: 'video' | 'image';
  url?: string;
  uploading?: boolean;
}

interface TikTokOptions {
  privacyLevel: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY';
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  brandContentToggle: boolean;
  brandOrganicToggle: boolean;
}

interface PlatformData {
  title: string;
  description: string;
  firstComment: string;
}

const PLATFORM_IDS: PlatformId[] = ['youtube', 'instagram', 'threads', 'tiktok', 'x'];

export default function PublishPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [contentDescription, setContentDescription] = useState('');
  const [contentType, setContentType] = useState('daily');
  const [instagramFormat, setInstagramFormat] = useState<'reel' | 'post'>('post');
  const ytCommentPin = false; // YouTube API는 고정 댓글 미지원, 일반 댓글만 가능
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<PlatformId, boolean>>({
    youtube: false, instagram: false, threads: false, tiktok: false, x: false,
  });
  const [platformData, setPlatformData] = useState<Record<PlatformId, PlatformData>>(() => {
    const initial: Record<string, PlatformData> = {};
    PLATFORM_IDS.forEach((id) => {
      initial[id] = { title: '', description: '', firstComment: '' };
    });
    return initial as Record<PlatformId, PlatformData>;
  });
  const [loadingAi, setLoadingAi] = useState<Record<PlatformId, boolean>>({
    youtube: false, instagram: false, threads: false, tiktok: false, x: false,
  });
  const [aiOptions, setAiOptions] = useState<Record<PlatformId, { titles: string[]; firstComments: string[] }>>({
    youtube: { titles: [], firstComments: [] },
    instagram: { titles: [], firstComments: [] },
    threads: { titles: [], firstComments: [] },
    tiktok: { titles: [], firstComments: [] },
    x: { titles: [], firstComments: [] },
  });
  const [tiktokOptions, setTiktokOptions] = useState<TikTokOptions>({
    privacyLevel: 'PUBLIC_TO_EVERYONE',
    disableComment: false,
    disableDuet: false,
    disableStitch: false,
    brandContentToggle: false,
    brandOrganicToggle: false,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    getPlatforms().then((data) => {
      setPlatforms(data);
      const initial: Record<string, boolean> = {};
      PLATFORM_IDS.forEach((id) => {
        initial[id] = data.some((p) => p.id === id && p.status === 'connected');
      });
      setSelectedPlatforms(initial as Record<PlatformId, boolean>);
    });
  }, []);

  const connectedPlatforms = new Set(platforms.filter((p) => p.status === 'connected').map((p) => p.id));

  const addFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const placeholders: UploadedFile[] = fileArray.map((file) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const isImage = file.type.startsWith('image/');
      return { name: file.name, size: `${sizeMB} MB`, type: isImage ? 'image' as const : 'video' as const, uploading: true };
    });
    setUploadedFiles((prev) => [...prev, ...placeholders]);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) {
          setUploadedFiles((prev) => prev.map((f) => f.name === file.name && f.uploading ? { ...f, uploading: false } : f));
          continue;
        }
        setUploadedFiles((prev) => prev.map((f) => f.name === file.name && f.uploading ? { ...f, url: data.url, uploading: false } : f));
      } catch {
        setUploadedFiles((prev) => prev.map((f) => f.name === file.name && f.uploading ? { ...f, uploading: false } : f));
      }
    }

    // 이미지만 올렸으면 YouTube/TikTok 자동 해제
    const allImages = [...uploadedFiles, ...placeholders].every((f) => f.type === 'image');
    if (allImages) {
      setSelectedPlatforms((prev) => ({ ...prev, youtube: false, tiktok: false }));
    }
    // 영상 포함 시 X 자동 해제
    const anyVideo = [...uploadedFiles, ...placeholders].some((f) => f.type === 'video');
    if (anyVideo) {
      setSelectedPlatforms((prev) => ({ ...prev, x: false }));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const togglePlatform = (id: PlatformId) => {
    if (!connectedPlatforms.has(id)) return;
    setSelectedPlatforms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateField = (platform: PlatformId, field: keyof PlatformData, value: string) => {
    setPlatformData((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value },
    }));
  };

  const fillAiRecommendation = async (platform: PlatformId) => {
    setLoadingAi((prev) => ({ ...prev, [platform]: true }));
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          contentType,
          videoTitle: contentDescription || uploadedFiles[0]?.name || '',
          videoDescription: contentDescription || '',
        }),
      });
      const rec = await res.json();
      if (!res.ok) {
        const mockRec = mockAiRecommendations[platform];
        if (mockRec) {
          setPlatformData((prev) => ({
            ...prev,
            [platform]: {
              title: mockRec.title || prev[platform].title,
              description: `${mockRec.description}\n\n${mockRec.hashtags}`,
              firstComment: mockRec.firstComment || prev[platform].firstComment,
            },
          }));
        }
      } else {
        setPlatformData((prev) => ({
          ...prev,
          [platform]: {
            title: rec.title || prev[platform].title,
            description: rec.description || prev[platform].description,
            firstComment: rec.firstComment || prev[platform].firstComment,
          },
        }));
        setAiOptions((prev) => ({
          ...prev,
          [platform]: {
            titles: rec.titles || [],
            firstComments: rec.firstComments || [],
          },
        }));
      }
    } catch {
      console.error('AI 추천 네트워크 오류');
    }
    setLoadingAi((prev) => ({ ...prev, [platform]: false }));
  };

  const handlePublish = async () => {
    const xOnly = activePlatforms.length === 1 && activePlatforms[0] === 'x';
    if (!xOnly && uploadedFiles.length === 0) return;
    if (activePlatforms.length === 0) return;
    setPublishing(true);
    try {
      const hasVideo = uploadedFiles.some((f) => f.type === 'video');
      const hasImage = uploadedFiles.some((f) => f.type === 'image');
      const mediaType = hasVideo && hasImage ? 'mixed' : hasVideo ? 'video' : 'image';
      const mediaUrls = uploadedFiles.filter((f) => f.url).map((f) => f.url!);
      if (mediaUrls.length === 0 && !xOnly) throw new Error('파일 업로드가 완료되지 않았습니다.');

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: activePlatforms,
          mediaUrls,
          mediaType,
          platformData: Object.fromEntries(activePlatforms.map((pid) => [pid, {
            ...platformData[pid],
            ...(pid === 'instagram' ? { instagramFormat } : {}),
            ...(pid === 'youtube' ? { pinComment: ytCommentPin } : {}),
            ...(pid === 'tiktok' ? { tiktokOptions } : {}),
          }])),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '발행 실패');
      }
      router.push('/history');
    } catch (err) {
      console.error('발행 실패:', err);
      setPublishing(false);
    }
  };

  const activePlatforms = PLATFORM_IDS.filter((id) => selectedPlatforms[id]);
  const firstFileUrl = uploadedFiles.find((f) => f.url)?.url;

  return (
    <div className="pb-24">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">콘텐츠 발행</h1>

      {/* 미디어 업로드 + 프리뷰 */}
      <div className="flex gap-6 mb-6">
        {/* 왼쪽: 업로드 */}
        <Card className="flex-1 min-w-0">
          <h2 className="text-sm font-medium text-gray-500 mb-3">미디어 업로드</h2>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2 mb-3">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-pearl-50 rounded-lg p-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                      {file.type === 'video' ? <FileVideo className="w-4 h-4 text-gray-400" /> : <ImageIcon className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {file.size}
                        {file.uploading && <span className="ml-1 text-indigo-500">업로드 중...</span>}
                        {!file.uploading && file.url && <span className="ml-1 text-emerald-500">완료</span>}
                        {!file.uploading && !file.url && <span className="ml-1 text-red-400">실패</span>}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(idx)} className="text-gray-300 hover:text-gray-500 cursor-pointer shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={clsx(
              'border-2 border-dashed rounded-xl text-center transition-all duration-200 cursor-pointer p-6',
              isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-pearl-50'
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-1">
              {uploadedFiles.length > 0 ? '파일 추가하기' : '파일을 드래그하거나 클릭'}
            </p>
            <p className="text-xs text-gray-300">MP4, MOV, AVI · JPG, PNG, WEBP</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
        </Card>

        {/* 오른쪽: 이미지 프리뷰 */}
        <div className="w-64 shrink-0">
          <Card className="h-full flex flex-col items-center justify-center">
            {firstFileUrl ? (
              <div className="w-full">
                <h2 className="text-sm font-medium text-gray-500 mb-3">미디어 프리뷰</h2>
                {uploadedFiles[0]?.type === 'video' ? (
                  <video src={firstFileUrl} className="w-full rounded-lg" controls muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={firstFileUrl} alt="Preview" className="w-full rounded-lg object-contain max-h-48" />
                )}
                {uploadedFiles.length > 1 && (
                  <p className="text-xs text-gray-400 text-center mt-2">+{uploadedFiles.length - 1}개 추가 파일</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-300">업로드된 미디어가<br />여기에 표시됩니다</p>
              </div>
            )}
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

        <h2 className="text-sm font-medium text-gray-500 mb-2">콘텐츠 설명</h2>
        <p className="text-xs text-gray-400 mb-3">이 콘텐츠가 어떤 내용인지 간단히 설명하면 AI가 유형에 맞춰 플랫폼별 텍스트를 추천합니다.</p>
        <textarea
          value={contentDescription}
          onChange={(e) => setContentDescription(e.target.value)}
          placeholder="예: 한강에서 자전거 타는 브이로그, 봄날 벚꽃 구경"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
        />
      </Card>

      {/* 플랫폼 선택 */}
      <Card className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">발행 플랫폼 선택</h2>
        <div className="flex gap-3 flex-wrap">
          {PLATFORM_IDS.filter((id) => {
            // 영상 파일이 있으면 X 플랫폼 숨김
            if (id === 'x' && uploadedFiles.some((f) => f.type === 'video')) return false;
            return true;
          }).map((id) => {
            const config = PLATFORM_CONFIG[id];
            const connected = connectedPlatforms.has(id);
            const selected = selectedPlatforms[id];
            const videoOnly = id === 'youtube' || id === 'tiktok';
            const hasVideo = uploadedFiles.some((f) => f.type === 'video');
            const mediaBlocked = (videoOnly && uploadedFiles.length > 0 && !hasVideo) || (id === 'x' && uploadedFiles.length > 0);
            const disabled = !connected || mediaBlocked;
            return (
              <button
                key={id}
                onClick={() => !disabled && togglePlatform(id)}
                disabled={disabled}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer',
                  disabled && 'opacity-40 cursor-not-allowed',
                  selected && !disabled
                    ? 'border-indigo-500 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                <PlatformIcon platform={id} className="w-4 h-4" colored={!selected || disabled} />
                <span>{config.name}</span>
                {!connected && <span className="text-xs text-gray-400">(연결 필요)</span>}
                {mediaBlocked && id !== 'x' && <span className="text-xs text-gray-400">(영상만 가능)</span>}
                {mediaBlocked && id === 'x' && <span className="text-xs text-gray-400">(텍스트만 가능)</span>}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 3컬럼: 입력 + 미리보기 */}
      {activePlatforms.length > 0 && (
        <div className="flex gap-6">
          {/* 왼쪽: 플랫폼별 입력 (2/3) */}
          <div className="flex-[2] min-w-0 space-y-4">
            {activePlatforms.map((id) => {
              const config = PLATFORM_CONFIG[id];
              const data = platformData[id];
              const loading = loadingAi[id];

              return (
                <Card key={id}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={id} className="w-4 h-4" colored />
                      <span className="font-semibold text-sm text-gray-800">{config.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => fillAiRecommendation(id)} disabled={loading}>
                      <Sparkles className={clsx('w-3 h-3', loading && 'animate-spin')} />
                      {loading ? '추천 중...' : 'AI 추천'}
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {id === 'instagram' && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">게시 형식</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setInstagramFormat('post')}
                            className={clsx(
                              'px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all',
                              instagramFormat === 'post'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                                : 'border-gray-200 text-gray-400 hover:border-gray-300'
                            )}
                          >
                            📷 게시물
                          </button>
                          <button
                            onClick={() => uploadedFiles.some((f) => f.type === 'video') && setInstagramFormat('reel')}
                            disabled={!uploadedFiles.some((f) => f.type === 'video')}
                            className={clsx(
                              'px-3 py-1 rounded-lg text-xs font-medium border transition-all',
                              !uploadedFiles.some((f) => f.type === 'video')
                                ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-300'
                                : instagramFormat === 'reel'
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600 cursor-pointer'
                                  : 'border-gray-200 text-gray-400 hover:border-gray-300 cursor-pointer'
                            )}
                          >
                            🎬 릴스 {!uploadedFiles.some((f) => f.type === 'video') && '(영상만)'}
                          </button>
                        </div>
                      </div>
                    )}
                    {id === 'tiktok' && (
                      <div className="space-y-3 p-3 bg-pearl-50 rounded-lg border border-gray-100">
                        {/* 크리에이터 정보 */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Info className="w-3.5 h-3.5 text-gray-400" />
                          <span>이 영상은 <strong className="text-gray-700">{platforms.find(p => p.id === 'tiktok')?.accountName || '@사용자'}</strong> 계정으로 게시됩니다</span>
                        </div>

                        {/* 공개 범위 */}
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">공개 범위</label>
                          <div className="relative">
                            <select
                              value={tiktokOptions.privacyLevel}
                              onChange={(e) => setTiktokOptions(prev => ({ ...prev, privacyLevel: e.target.value as TikTokOptions['privacyLevel'] }))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none cursor-pointer"
                            >
                              <option value="PUBLIC_TO_EVERYONE">모든 사람에게 공개</option>
                              <option value="MUTUAL_FOLLOW_FRIENDS">서로 팔로우한 친구만</option>
                              <option value="FOLLOWER_OF_CREATOR">팔로워만</option>
                              <option value="SELF_ONLY">나만 보기</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        {/* 상호작용 설정 */}
                        <div>
                          <label className="text-xs text-gray-400 mb-1.5 block">상호작용 허용</label>
                          <div className="flex gap-2">
                            {[
                              { key: 'disableComment' as const, label: '댓글' },
                              { key: 'disableDuet' as const, label: '듀엣' },
                              { key: 'disableStitch' as const, label: '스티치' },
                            ].map(({ key, label }) => (
                              <button
                                key={key}
                                onClick={() => setTiktokOptions(prev => ({ ...prev, [key]: !prev[key] }))}
                                className={clsx(
                                  'px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all',
                                  !tiktokOptions[key]
                                    ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                )}
                              >
                                {!tiktokOptions[key] ? '✓' : '✗'} {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 상업적 콘텐츠 공개 */}
                        <div>
                          <label className="text-xs text-gray-400 mb-1.5 block">상업적 콘텐츠 공개</label>
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tiktokOptions.brandContentToggle}
                                onChange={(e) => setTiktokOptions(prev => ({ ...prev, brandContentToggle: e.target.checked }))}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-200 cursor-pointer"
                              />
                              <span className="text-xs text-gray-600">브랜드 콘텐츠 (제3자에 의한 프로모션)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tiktokOptions.brandOrganicToggle}
                                onChange={(e) => setTiktokOptions(prev => ({ ...prev, brandOrganicToggle: e.target.checked }))}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-200 cursor-pointer"
                              />
                              <span className="text-xs text-gray-600">자체 브랜드 홍보 (본인 제품/서비스 홍보)</span>
                            </label>
                          </div>
                        </div>

                        {/* 음악/저작권 경고 */}
                        <div className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg p-2">
                          ⚠️ 이 영상에 저작권이 있는 음악이 포함된 경우, 게시 후 TikTok에 의해 음소거되거나 삭제될 수 있습니다. 원본 사운드 또는 라이선스가 있는 음악만 사용하세요.
                        </div>
                      </div>
                    )}
                    {config.maxTitleLength > 0 && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">제목</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={data.title}
                            onChange={(e) => updateField(id, 'title', e.target.value)}
                            placeholder="제목을 입력하세요"
                            maxLength={config.maxTitleLength}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-300">
                            {data.title.length}/{config.maxTitleLength}
                          </span>
                        </div>
                        {aiOptions[id].titles.length > 1 && (
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {aiOptions[id].titles.map((t, i) => (
                              <button
                                key={i}
                                onClick={() => updateField(id, 'title', t)}
                                className={clsx(
                                  'px-2 py-0.5 rounded text-xs border cursor-pointer transition-all',
                                  data.title === t
                                    ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                )}
                              >
                                옵션 {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">설명</label>
                      <div className="relative">
                        <textarea
                          value={data.description}
                          onChange={(e) => updateField(id, 'description', e.target.value)}
                          placeholder="설명을 입력하세요"
                          maxLength={config.maxDescriptionLength}
                          rows={5}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                        />
                        <span className="absolute right-2 bottom-1.5 text-xs text-gray-300">
                          {data.description.length}/{config.maxDescriptionLength}
                        </span>
                      </div>
                    </div>
                    {(id === 'youtube' || id === 'instagram' || id === 'x') && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-400">첫 댓글</label>
                        {id === 'youtube' && (
                          <div className="flex gap-1.5">
                            <span className="px-2 py-0.5 rounded text-xs border border-indigo-400 bg-indigo-50 text-indigo-600">
                              ✦ 일반 댓글
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs border border-gray-200 text-gray-300 line-through cursor-not-allowed" title="YouTube API에서 고정 댓글을 지원하지 않습니다">
                              📌 고정 댓글
                            </span>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={data.firstComment}
                        onChange={(e) => updateField(id, 'firstComment', e.target.value)}
                        placeholder="첫 댓글 (선택)"
                        rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                      />
                      {aiOptions[id].firstComments.length > 1 && (
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {aiOptions[id].firstComments.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => updateField(id, 'firstComment', c)}
                              className={clsx(
                                'px-2 py-0.5 rounded text-xs border cursor-pointer transition-all max-w-full truncate',
                                data.firstComment === c
                                  ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
                              )}
                            >
                              {c.length > 30 ? c.substring(0, 30) + '...' : c}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="w-[440px] shrink-0">
            <div className="sticky top-0">
              <h2 className="text-sm font-medium text-gray-500 mb-3">플랫폼별 미리보기</h2>
              <div className="space-y-4">
                {activePlatforms.map((id) => (
                  <PlatformPreview
                    key={id}
                    platform={id}
                    data={platformData[id]}
                    fileName={uploadedFiles[0]?.name}
                    mediaUrl={firstFileUrl}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 하단 발행 버튼 */}
      <div className="fixed bottom-0 left-72 right-0 bg-white/80 backdrop-blur-sm border-t border-pearl-200 px-8 py-4 z-30">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {activePlatforms.length > 0 ? (
              <span>{activePlatforms.length}개 플랫폼에 발행</span>
            ) : (
              <span className="text-gray-300">발행할 플랫폼을 선택하세요</span>
            )}
          </div>
          <Button
            variant="primary"
            size="lg"
            disabled={
              activePlatforms.length === 0 ||
              publishing ||
              uploadedFiles.some((f) => f.uploading) ||
              (uploadedFiles.length > 0 && !uploadedFiles.some((f) => f.url)) ||
              (uploadedFiles.length === 0 && !activePlatforms.every((p) => p === 'x'))
            }
            onClick={handlePublish}
          >
            {publishing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 발행 중...</>
            ) : (
              <><Send className="w-4 h-4" /> 지금 발행</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
