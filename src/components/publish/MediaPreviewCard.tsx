'use client';

import { ImageIcon } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { UploadedFile } from '@/lib/hooks/useFileUpload';

interface MediaPreviewCardProps {
  files: UploadedFile[];
  emptyHint?: string;
}

export default function MediaPreviewCard({ files, emptyHint }: MediaPreviewCardProps) {
  const firstFileUrl = files.find((f) => f.url)?.url;
  const firstFile = files[0];

  return (
    <Card className="h-full flex flex-col items-center justify-center">
      {firstFileUrl ? (
        <div className="w-full">
          <h2 className="text-sm font-medium text-gray-500 mb-3">미디어 프리뷰</h2>
          {firstFile?.type === 'video' ? (
            <video src={firstFileUrl} className="w-full rounded-lg" controls muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={firstFileUrl} alt="Preview" className="w-full rounded-lg object-contain max-h-48" />
          )}
          {files.length > 1 && (
            <p className="text-xs text-gray-400 text-center mt-2">+{files.length - 1}개 추가 파일</p>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <ImageIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-gray-300">{emptyHint || '업로드된 미디어가\n여기에 표시됩니다'}</p>
        </div>
      )}
    </Card>
  );
}
