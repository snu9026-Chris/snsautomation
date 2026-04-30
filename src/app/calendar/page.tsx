'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, Clock, Loader2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import DayPanel from '@/components/calendar/DayPanel';
import FileUploadCard from '@/components/publish/FileUploadCard';
import MediaPreviewCard from '@/components/publish/MediaPreviewCard';
import ContentTypeSelector from '@/components/publish/ContentTypeSelector';
import PlatformSelector from '@/components/publish/PlatformSelector';
import PlatformFormPanel from '@/components/publish/PlatformFormPanel';
import PlatformPreview from '@/components/publish/PlatformPreview';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { usePublishForm, PLATFORM_IDS, type PlatformData } from '@/lib/hooks/usePublishForm';
import { useAiRecommendation } from '@/lib/hooks/useAiRecommendation';
import { api, ApiError } from '@/lib/services/api';
import type { PlatformId, ScheduledPost } from '@/types';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [, setEditingPost] = useState<ScheduledPost | null>(null);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [submitting, setSubmitting] = useState(false);

  const form = usePublishForm({ autoSelectConnected: true });
  const upload = useFileUpload({ onMediaTypeChange: form.onMediaTypeChange });

  const fillAiRecommendation = useAiRecommendation({
    contentType: form.contentType,
    contentDescription: form.contentDescription,
    uploadedFileName: upload.files[0]?.name,
    setLoadingAi: form.setLoadingAi,
    setPlatformData: form.setPlatformData,
  });

  // 월별 예약 조회
  const fetchScheduledPosts = useCallback(async () => {
    const month = currentMonth.getMonth() + 1;
    const year = currentMonth.getFullYear();
    try {
      const data = await api.get<ScheduledPost[]>('/api/schedule', {
        searchParams: { month, year },
      });
      if (Array.isArray(data)) setScheduledPosts(data);
    } catch (err) {
      console.error('[calendar] fetchScheduledPosts failed:', err);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchScheduledPosts();
  }, [fetchScheduledPosts]);

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
      scheduledDates.set(dateKey, {
        count: 1,
        platforms: [...post.platforms] as PlatformId[],
      });
    }
  });

  const selectedDayPosts = scheduledPosts.filter(
    (p) => p.scheduledAt.split('T')[0] === selectedDate
  );

  const handleSchedule = async () => {
    if (form.activePlatforms.length === 0 || !selectedDate) return;
    const xOnly = form.activePlatforms.length === 1 && form.activePlatforms[0] === 'x';
    if (!xOnly && upload.files.length === 0) return;

    setSubmitting(true);
    try {
      const hasVideo = upload.files.some((f) => f.type === 'video');
      const hasImage = upload.files.some((f) => f.type === 'image');
      const mediaType = hasVideo && hasImage ? 'mixed' : hasVideo ? 'video' : 'image';
      const mediaUrls = upload.files.filter((f) => f.url).map((f) => f.url!);

      const pData = Object.fromEntries(
        form.activePlatforms.map((pid) => [
          pid,
          {
            ...form.platformData[pid],
            ...(pid === 'instagram' ? { instagramFormat: form.instagramFormat } : {}),
          },
        ])
      );

      // KST 시간을 UTC로 변환 (KST = UTC+9)
      const kstDate = new Date(`${selectedDate}T${scheduledTime}:00+09:00`);
      const scheduledAt = kstDate.toISOString();

      await api.post('/api/schedule', {
        platforms: form.activePlatforms,
        mediaUrls,
        mediaType,
        platformData: pData,
        scheduledAt,
      });

      setShowForm(false);
      upload.reset();
      form.reset();
      fetchScheduledPosts();
    } catch (err) {
      if (err instanceof ApiError) console.error('[calendar] schedule failed:', err.message);
      else console.error('[calendar] schedule failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.delete(`/api/schedule/${id}`);
    } catch (err) {
      console.error('[calendar] cancel failed:', err);
    }
    fetchScheduledPosts();
  };

  const handleCreateNew = () => {
    setEditingPost(null);
    setShowForm(true);
  };

  const handleEdit = (post: ScheduledPost) => {
    setEditingPost(post);
    const initSelection: Record<string, boolean> = {};
    PLATFORM_IDS.forEach((id) => {
      initSelection[id] = post.platforms.includes(id);
    });
    form.setSelectedPlatforms(initSelection as Record<PlatformId, boolean>);
    const initData: Record<string, PlatformData> = {};
    PLATFORM_IDS.forEach((id) => {
      const pd = post.platformData[id];
      initData[id] = pd
        ? {
            title: pd.title || '',
            description: pd.description || '',
            firstComment: pd.firstComment || '',
          }
        : { title: '', description: '', firstComment: '' };
    });
    form.setPlatformData(initData as Record<PlatformId, PlatformData>);
    setShowForm(true);
  };

  const formatSelectedDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const firstFileUrl = upload.files.find((f) => f.url)?.url;

  return (
    <div className="pb-24">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">예약 발행</h1>

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

      {showForm && selectedDate && (
        <>
          <div className="flex gap-6 mb-6">
            <FileUploadCard
              files={upload.files}
              isDragOver={upload.isDragOver}
              onAddFiles={upload.addFiles}
              onRemoveFile={upload.removeFile}
              onDragOver={upload.handleDragOver}
              onDragLeave={upload.handleDragLeave}
              onDrop={upload.handleDrop}
              onAppendExternalFiles={upload.appendExternalFiles}
            />
            <div className="w-64 shrink-0">
              <MediaPreviewCard files={upload.files} emptyHint="미디어 프리뷰" />
            </div>
          </div>

          <ContentTypeSelector
            contentType={form.contentType}
            contentDescription={form.contentDescription}
            onContentTypeChange={form.setContentType}
            onContentDescriptionChange={form.setContentDescription}
            showDescriptionHint={false}
          />

          <PlatformSelector
            files={upload.files}
            selectedPlatforms={form.selectedPlatforms}
            connectedPlatforms={form.connectedPlatforms}
            onToggle={form.togglePlatform}
          />

          {form.activePlatforms.length > 0 && (
            <div className="flex gap-6 mb-6">
              <div className="flex-[2] min-w-0 space-y-4">
                {form.activePlatforms.map((id) => (
                  <PlatformFormPanel
                    key={id}
                    platformId={id}
                    data={form.platformData[id]}
                    loadingAi={form.loadingAi[id]}
                    files={upload.files}
                    instagramFormat={form.instagramFormat}
                    onInstagramFormatChange={form.setInstagramFormat}
                    tiktokOptions={form.tiktokOptions}
                    onTiktokOptionsChange={form.setTiktokOptions}
                    onUpdateField={form.updateField}
                    onAiRecommend={fillAiRecommendation}
                    variant="compact"
                  />
                ))}
              </div>
              <div className="w-[440px] shrink-0">
                <div className="sticky top-0">
                  <h2 className="text-sm font-medium text-gray-500 mb-3">플랫폼별 미리보기</h2>
                  <div className="space-y-4">
                    {form.activePlatforms.map((id) => (
                      <PlatformPreview
                        key={id}
                        platform={id}
                        data={form.platformData[id]}
                        fileName={upload.files[0]?.name}
                        mediaUrl={firstFileUrl}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="fixed bottom-0 left-72 right-0 bg-white/80 backdrop-blur-sm border-t border-pearl-200 px-8 py-4 z-30">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {showForm && selectedDate ? (
              <span className="flex items-center gap-3">
                <CalendarCheck className="w-4 h-4 text-indigo-500" />
                <span className="font-medium text-indigo-600">{formatSelectedDate(selectedDate)}</span>
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
                {form.activePlatforms.length > 0
                  ? `${form.activePlatforms.length}개 플랫폼`
                  : '플랫폼 선택 필요'}
                <button
                  onClick={() => setShowForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  취소
                </button>
              </span>
            ) : selectedDate ? (
              <span>
                {formatSelectedDate(selectedDate)} 선택됨 &middot; 예약 {selectedDayPosts.length}개
              </span>
            ) : (
              <span className="text-gray-300">날짜를 선택하세요</span>
            )}
          </div>
          {showForm ? (
            <Button
              variant="primary"
              size="lg"
              disabled={
                form.activePlatforms.length === 0 ||
                submitting ||
                upload.files.some((f) => f.uploading) ||
                (upload.files.length === 0 && !form.activePlatforms.every((p) => p === 'x'))
              }
              onClick={handleSchedule}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 예약 중...
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4" /> 예약하기
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
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
