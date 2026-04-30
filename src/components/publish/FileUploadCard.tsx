'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { FileVideo, ImageIcon, Upload, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import GooglePhotoPicker from '@/components/publish/GooglePhotoPicker';
import type { UploadedFile } from '@/lib/hooks/useFileUpload';

interface FileUploadCardProps {
  files: UploadedFile[];
  isDragOver: boolean;
  onAddFiles: (files: FileList) => void | Promise<void>;
  onRemoveFile: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onAppendExternalFiles: (files: UploadedFile[]) => void;
  emptyHint?: string;
}

export default function FileUploadCard({
  files,
  isDragOver,
  onAddFiles,
  onRemoveFile,
  onDragOver,
  onDragLeave,
  onDrop,
  onAppendExternalFiles,
  emptyHint = '파일을 드래그하거나 클릭',
}: FileUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="flex-1 min-w-0">
      <h2 className="text-sm font-medium text-gray-500 mb-3">미디어 업로드</h2>

      {files.length > 0 && (
        <div className="space-y-2 mb-3">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between bg-pearl-50 rounded-lg p-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                  {file.type === 'video' ? (
                    <FileVideo className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                  )}
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
              <button
                onClick={() => onRemoveFile(idx)}
                className="text-gray-300 hover:text-gray-500 cursor-pointer shrink-0"
              >
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
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500 mb-1">
          {files.length > 0 ? '파일 추가하기' : emptyHint}
        </p>
        <p className="text-xs text-gray-300">MP4, MOV, AVI · JPG, PNG, WEBP</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) void onAddFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="mt-3">
        <GooglePhotoPicker
          onPhotosSelected={(photos) => {
            const mapped: UploadedFile[] = photos.map((p) => ({
              name: p.name,
              size: '- MB',
              type: p.type,
              url: p.url,
              uploading: false,
            }));
            onAppendExternalFiles(mapped);
          }}
        />
      </div>
    </Card>
  );
}
