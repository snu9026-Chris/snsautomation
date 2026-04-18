'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import DayPanel from '@/components/calendar/DayPanel';
import PlatformIcon from '@/components/icons/PlatformIcon';
import PlatformPreview from '@/components/publish/PlatformPreview';
import { PLATFORM_CONFIG } from '@/lib/constants';
import { getPlatforms } from '@/lib/queries';
import type { PlatformId, Platform, ScheduledPost } from '@/types';
import {
  Upload, Sparkles, CalendarCheck, X, FileVideo, ImageIcon, Loader2, Clock,
} from 'lucide-react';
import clsx from 'clsx';

interface UploadedFile {
  name: string;
  size: string;
  type: 'video' | 'image';
  url?: string;
  uploading?: boolean;
}

interface PlatformData {
  title: string;
  description: string;
  firstComment: string;
}

const PLATFORM_IDS: PlatformId[] = ['youtube', 'instagram', 'threads', 'tiktok', 'x'];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  // 캘린더 상태
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [submitting, setSubmitting] = useState(false);

  // 발행 폼 상태 (publish 페이지와 동일)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [contentType, setContentType] = useState('daily');
  const [contentDescription, setContentDescription] = useState('');
  const [instagramFormat, setInstagramFormat] = useState<'reel' | 'post'>('post');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<PlatformId, boolean>>({
    youtube: false, instagram: false, threads: false, tiktok: false, x: false,
  });
  const [platformData, setPlatformData] = useState<Record<PlatformId, PlatformData>>(() => {
    const initial: Record<string, PlatformData> = {};
    PLATFORM_IDS.forEach((id) => { initial[id] = { title: '', description: '', firstComment: '' }; });
    return initial as Record<PlatformId, PlatformData>;
  });
  const [loadingAi, setLoadingAi] = useState<Record<PlatformId, boolean>>({
    youtube: false, instagram: false, threads: false, tiktok: false, x: false,
  });
  const [isDragOver, setIsDragOver] = useState(false);

  const connectedPlatforms = new Set(platforms.filter((p) => p.status === 'connected').map((p) => p.id));
  const activePlatforms = PLATFORM_IDS.filter((id) => selectedPlatforms[id]);
  const firstFileUrl = uploadedFiles.find((f) => f.url)?.url;

  // 초기 로드
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

  // 월별 예약 조회
  const fetchScheduledPosts = useCallback(async () => {
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();
    try {
      const res = await fetch(`/api/schedule?month=${month}&year=${year}`);
      const data = await res.json();
      if (Array.isArray(data)) setScheduledPosts(data);
    } catch { /* ignore */ }
  }, [currentMonth]);

  useEffect(() => { fetchScheduledPosts(); }, [fetchScheduledPosts]);

  // 캘린더 날짜별 예약 맵
  const scheduledDates = new Map<string, { count: number; platforms: PlatformId[] }>();
  scheduledPosts.forEach((post) => {
    const dateKey = post.scheduledAt.split('T')[0];
    const existing = scheduledDates.get(dateKey);
    if (existing) {
      existing.count++;
      post.platforms.forEach((p) => {
        if (!existing.platforms.includes(p as PlatformId)) existing.platforms.push(p as PlatformId);
      });
    } else {
      scheduledDates.set(dateKey, { count: 1, platforms: [...post.platforms] as PlatformId[] });
    }
  });

  const selectedDayPosts = scheduledPosts.filter((p) => p.scheduledAt.split('T')[0] === selectedDate);

  // 파일 업로드
  const addFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const placeholders: UploadedFile[] = fileArray.map((file) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const isImage = file.type.startsWith('image/');
      return { name: file.name, size: `${sizeMB} MB`, type: isImage ? 'image' : 'video', uploading: true };
    });
    setUploadedFiles((prev) => [...prev, ...placeholders]);

    // 영상 파일이 포함되면 X 자동 해제
    const anyVideo = [...uploadedFiles, ...placeholders].some((f) => f.type === 'video');
    if (anyVideo) {
      setSelectedPlatforms((prev) => ({ ...prev, x: false }));
    }
    // 이미지만이면 YouTube/TikTok 자동 해제
    const allImages = [...uploadedFiles, ...placeholders].every((f) => f.type === 'image');
    if (allImages) {
      setSelectedPlatforms((prev) => ({ ...prev, youtube: false, tiktok: false }));
    }

    for (const file of fileArray) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
          setUploadedFiles((prev) => prev.map((f) => f.name === file.name && f.uploading ? { ...f, url: data.url, uploading: false } : f));
        } else {
          setUploadedFiles((prev) => prev.map((f) => f.name === file.name && f.uploading ? { ...f, uploading: false } : f));
        }
      } catch {
        setUploadedFiles((prev) => prev.map((f) => f.name === file.name && f.uploading ? { ...f, uploading: false } : f));
      }
    }
  };

  const removeFile = (index: number) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const togglePlatform = (id: PlatformId) => {
    if (!connectedPlatforms.has(id)) return;
    setSelectedPlatforms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateField = (platform: PlatformId, field: keyof PlatformData, value: string) => {
    setPlatformData((prev) => ({ ...prev, [platform]: { ...prev[platform], [field]: value } }));
  };

  const fillAiRecommendation = async (platform: PlatformId) => {
    setLoadingAi((prev) => ({ ...prev, [platform]: true }));
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform, contentType,
          videoTitle: contentDescription || uploadedFiles[0]?.name || '',
          videoDescription: contentDescription || '',
        }),
      });
      const rec = await res.json();
      if (res.ok) {
        setPlatformData((prev) => ({
          ...prev,
          [platform]: {
            title: rec.title || prev[platform].title,
            description: rec.description || prev[platform].description,
            firstComment: rec.firstComment || prev[platform].firstComment,
          },
        }));
      }
    } catch { /* ignore */ }
    setLoadingAi((prev) => ({ ...prev, [platform]: false }));
  };

  // 예약 생성
  const handleSchedule = async () => {
    if (activePlatforms.length === 0 || !selectedDate) return;
    const xOnly = activePlatforms.length === 1 && activePlatforms[0] === 'x';
    if (!xOnly && uploadedFiles.length === 0) return;

    setSubmitting(true);
    try {
      const hasVideo = uploadedFiles.some((f) => f.type === 'video');
      const hasImage = uploadedFiles.some((f) => f.type === 'image');
      const mediaType = hasVideo && hasImage ? 'mixed' : hasVideo ? 'video' : 'image';
      const mediaUrls = uploadedFiles.filter((f) => f.url).map((f) => f.url!);

      const pData = Object.fromEntries(activePlatforms.map((pid) => [pid, {
        ...platformData[pid],
        ...(pid === 'instagram' ? { instagramFormat } : {}),
      }]));

      // KST 시간을 UTC로 변환 (KST = UTC+9)
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const kstDate = new Date(`${selectedDate}T${scheduledTime}:00+09:00`);
      const scheduledAt = kstDate.toISOString();

      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: activePlatforms,
          mediaUrls, mediaType,
          platformData: pData,
          scheduledAt,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setUploadedFiles([]);
        setPlatformData(() => {
          const initial: Record<string, PlatformData> = {};
          PLATFORM_IDS.forEach((id) => { initial[id] = { title: '', description: '', firstComment: '' }; });
          return initial as Record<PlatformId, PlatformData>;
        });
        setContentDescription('');
        fetchScheduledPosts();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  // 예약 취소
  const handleCancel = async (id: string) => {
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
    fetchScheduledPosts();
  };

  // 새 예약 폼 열기
  const handleCreateNew = () => {
    setEditingPost(null);
    setShowForm(true);
  };

  // 수정 시작
  const handleEdit = (post: ScheduledPost) => {
    setEditingPost(post);
    // 기존 데이터 채우기
    const initPlatforms: Record<string, boolean> = {};
    PLATFORM_IDS.forEach((id) => { initPlatforms[id] = post.platforms.includes(id); });
    setSelectedPlatforms(initPlatforms as Record<PlatformId, boolean>);
    const initData: Record<string, PlatformData> = {};
    PLATFORM_IDS.forEach((id) => {
      const pd = post.platformData[id];
      initData[id] = pd ? { title: pd.title || '', description: pd.description || '', firstComment: pd.firstComment || '' } : { title: '', description: '', firstComment: '' };
    });
    setPlatformData(initData as Record<PlatformId, PlatformData>);
    setShowForm(true);
  };

  const formatSelectedDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="pb-24">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">예약 발행</h1>

      {/* 상단: 캘린더 + 날짜 패널 */}
      <div className="flex gap-6 mb-6">
        <Card className="flex-1 min-w-0">
          <CalendarGrid
            currentMonth={currentMonth}
            scheduledDates={scheduledDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onMonthChange={setCurrentMonth}
          />
        </Card>
        <div className="w-80 shrink-0">
          <Card className="h-full">
            <DayPanel
              date={selectedDate}
              posts={selectedDayPosts}
              onCreateNew={handleCreateNew}
              onEdit={handleEdit}
              onCancel={handleCancel}
            />
          </Card>
        </div>
      </div>

      {/* 예약 폼 */}
      {showForm && selectedDate && (
        <>
          {/* 미디어 업로드 + 프리뷰 */}
          <div className="flex gap-6 mb-6">
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
                <p className="text-sm text-gray-500 mb-1">파일을 드래그하거나 클릭</p>
                <p className="text-xs text-gray-300">MP4, MOV, AVI · JPG, PNG, WEBP</p>
                <input ref={fileInputRef} type="file" accept="video/*,image/*" multiple className="hidden"
                  onChange={(e) => { if (e.target.files && e.target.files.length > 0) addFiles(e.target.files); e.target.value = ''; }}
                />
              </div>
            </Card>

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
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ImageIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-300">미디어 프리뷰</p>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* 콘텐츠 유형 */}
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
                <button key={type.id} onClick={() => setContentType(type.id)}
                  className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border',
                    contentType === type.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  )}
                >{type.emoji} {type.label}</button>
              ))}
            </div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">콘텐츠 설명</h2>
            <textarea value={contentDescription} onChange={(e) => setContentDescription(e.target.value)}
              placeholder="예: 한강에서 자전거 타는 브이로그, 봄날 벚꽃 구경" rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
            />
          </Card>

          {/* 플랫폼 선택 */}
          <Card className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-3">발행 플랫폼 선택</h2>
            <div className="flex gap-3 flex-wrap">
              {PLATFORM_IDS.filter((id) => {
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
                  <button key={id} onClick={() => !disabled && togglePlatform(id)} disabled={disabled}
                    className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer',
                      disabled && 'opacity-40 cursor-not-allowed',
                      selected && !disabled ? 'border-indigo-500 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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

          {/* 플랫폼별 입력 + 미리보기 */}
          {activePlatforms.length > 0 && (
            <div className="flex gap-6 mb-6">
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
                              <button onClick={() => setInstagramFormat('post')}
                                className={clsx('px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all',
                                  instagramFormat === 'post' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-400'
                                )}>📷 게시물</button>
                              <button onClick={() => uploadedFiles.some((f) => f.type === 'video') && setInstagramFormat('reel')}
                                disabled={!uploadedFiles.some((f) => f.type === 'video')}
                                className={clsx('px-3 py-1 rounded-lg text-xs font-medium border transition-all',
                                  !uploadedFiles.some((f) => f.type === 'video') ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-300' :
                                    instagramFormat === 'reel' ? 'border-indigo-500 bg-indigo-50 text-indigo-600 cursor-pointer' : 'border-gray-200 text-gray-400 cursor-pointer'
                                )}>🎬 릴스</button>
                            </div>
                          </div>
                        )}
                        {config.maxTitleLength > 0 && (
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">제목</label>
                            <input type="text" value={data.title} onChange={(e) => updateField(id, 'title', e.target.value)}
                              placeholder="제목을 입력하세요" maxLength={config.maxTitleLength}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">설명</label>
                          <textarea value={data.description} onChange={(e) => updateField(id, 'description', e.target.value)}
                            placeholder="설명을 입력하세요" maxLength={config.maxDescriptionLength} rows={4}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                          />
                        </div>
                        {(id === 'youtube' || id === 'instagram' || id === 'x') && (
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">첫 댓글</label>
                            <textarea value={data.firstComment} onChange={(e) => updateField(id, 'firstComment', e.target.value)}
                              placeholder="첫 댓글 (선택)" rows={2}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
              <div className="w-[440px] shrink-0">
                <div className="sticky top-0">
                  <h2 className="text-sm font-medium text-gray-500 mb-3">플랫폼별 미리보기</h2>
                  <div className="space-y-4">
                    {activePlatforms.map((id) => (
                      <PlatformPreview key={id} platform={id} data={platformData[id]} fileName={uploadedFiles[0]?.name} mediaUrl={firstFileUrl} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 하단 바 */}
      <div className="fixed bottom-0 left-72 right-0 bg-white/80 backdrop-blur-sm border-t border-pearl-200 px-8 py-4 z-30">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {showForm && selectedDate ? (
              <span className="flex items-center gap-3">
                <CalendarCheck className="w-4 h-4 text-indigo-500" />
                <span className="font-medium text-indigo-600">{formatSelectedDate(selectedDate)}</span>
                {/* 시간 선택 */}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm font-medium text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                  />
                  <span className="text-xs text-gray-400">KST</span>
                </span>
                {activePlatforms.length > 0 ? `${activePlatforms.length}개 플랫폼` : '플랫폼 선택 필요'}
                <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">취소</button>
              </span>
            ) : selectedDate ? (
              <span>{formatSelectedDate(selectedDate)} 선택됨 &middot; 예약 {selectedDayPosts.length}개</span>
            ) : (
              <span className="text-gray-300">날짜를 선택하세요</span>
            )}
          </div>
          {showForm ? (
            <Button variant="primary" size="lg"
              disabled={activePlatforms.length === 0 || submitting || uploadedFiles.some((f) => f.uploading) ||
                (uploadedFiles.length === 0 && !activePlatforms.every((p) => p === 'x'))}
              onClick={handleSchedule}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 예약 중...</>
              ) : (
                <><CalendarCheck className="w-4 h-4" /> 예약하기</>
              )}
            </Button>
          ) : (
            <Button variant="primary" size="lg"
              disabled={!selectedDate || selectedDate < todayKey()}
              onClick={handleCreateNew}
            >
              <CalendarCheck className="w-4 h-4" /> 새 예약
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
