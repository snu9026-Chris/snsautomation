'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import Button from '@/components/ui/Button';
import FileUploadCard from '@/components/publish/FileUploadCard';
import MediaPreviewCard from '@/components/publish/MediaPreviewCard';
import ContentTypeSelector from '@/components/publish/ContentTypeSelector';
import PlatformSelector from '@/components/publish/PlatformSelector';
import PlatformFormPanel from '@/components/publish/PlatformFormPanel';
import PlatformPreview from '@/components/publish/PlatformPreview';
import { usePlatforms } from '@/lib/context/PlatformsContext';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { usePublishForm } from '@/lib/hooks/usePublishForm';
import { useAiRecommendation } from '@/lib/hooks/useAiRecommendation';
import { api } from '@/lib/services/api';

export default function PublishPage() {
  const router = useRouter();
  const { loading: platformsLoading } = usePlatforms();
  const [publishing, setPublishing] = useState(false);

  const form = usePublishForm({ autoSelectConnected: true });
  const upload = useFileUpload({ onMediaTypeChange: form.onMediaTypeChange });

  // 플랫폼 데이터 로드 완료 시 연결된 플랫폼 자동 선택
  useEffect(() => {
    if (!platformsLoading) form.initSelectionFromConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformsLoading]);

  const fillAiRecommendation = useAiRecommendation({
    contentType: form.contentType,
    contentDescription: form.contentDescription,
    uploadedFileName: upload.files[0]?.name,
    setLoadingAi: form.setLoadingAi,
    setPlatformData: form.setPlatformData,
    setAiOptions: form.setAiOptions,
    fallbackToMock: true,
  });

  const firstFileUrl = upload.files.find((f) => f.url)?.url;

  const handlePublish = async () => {
    const xOnly = form.activePlatforms.length === 1 && form.activePlatforms[0] === 'x';
    if (!xOnly && upload.files.length === 0) return;
    if (form.activePlatforms.length === 0) return;

    setPublishing(true);
    try {
      const hasVideo = upload.files.some((f) => f.type === 'video');
      const hasImage = upload.files.some((f) => f.type === 'image');
      const mediaType = hasVideo && hasImage ? 'mixed' : hasVideo ? 'video' : 'image';
      const mediaUrls = upload.files.filter((f) => f.url).map((f) => f.url!);
      if (mediaUrls.length === 0 && !xOnly) throw new Error('파일 업로드가 완료되지 않았습니다.');

      await api.post('/api/publish', {
        platforms: form.activePlatforms,
        mediaUrls,
        mediaType,
        platformData: Object.fromEntries(
          form.activePlatforms.map((pid) => [
            pid,
            {
              ...form.platformData[pid],
              ...(pid === 'instagram' ? { instagramFormat: form.instagramFormat } : {}),
              ...(pid === 'tiktok' ? { tiktokOptions: form.tiktokOptions } : {}),
            },
          ])
        ),
      });
      router.push('/history');
    } catch (err) {
      console.error('발행 실패:', err);
      setPublishing(false);
    }
  };

  return (
    <div className="pb-24">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">콘텐츠 발행</h1>

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
          <MediaPreviewCard files={upload.files} />
        </div>
      </div>

      <ContentTypeSelector
        contentType={form.contentType}
        contentDescription={form.contentDescription}
        onContentTypeChange={form.setContentType}
        onContentDescriptionChange={form.setContentDescription}
      />

      <PlatformSelector
        files={upload.files}
        selectedPlatforms={form.selectedPlatforms}
        connectedPlatforms={form.connectedPlatforms}
        onToggle={form.togglePlatform}
      />

      {form.activePlatforms.length > 0 && (
        <div className="flex gap-6">
          <div className="flex-[2] min-w-0 space-y-4">
            {form.activePlatforms.map((id) => (
              <PlatformFormPanel
                key={id}
                platformId={id}
                data={form.platformData[id]}
                loadingAi={form.loadingAi[id]}
                aiOptions={form.aiOptions[id]}
                files={upload.files}
                instagramFormat={form.instagramFormat}
                onInstagramFormatChange={form.setInstagramFormat}
                tiktokOptions={form.tiktokOptions}
                onTiktokOptionsChange={form.setTiktokOptions}
                onUpdateField={form.updateField}
                onAiRecommend={fillAiRecommendation}
                variant="publish"
                platforms={form.platforms}
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

      <div className="fixed bottom-0 left-72 right-0 bg-white/80 backdrop-blur-sm border-t border-pearl-200 px-8 py-4 z-30">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {form.activePlatforms.length > 0 ? (
              <span>{form.activePlatforms.length}개 플랫폼에 발행</span>
            ) : (
              <span className="text-gray-300">발행할 플랫폼을 선택하세요</span>
            )}
          </div>
          <Button
            variant="primary"
            size="lg"
            disabled={
              form.activePlatforms.length === 0 ||
              publishing ||
              upload.files.some((f) => f.uploading) ||
              (upload.files.length > 0 && !upload.files.some((f) => f.url)) ||
              (upload.files.length === 0 && !form.activePlatforms.every((p) => p === 'x'))
            }
            onClick={handlePublish}
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> 발행 중...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> 지금 발행
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
