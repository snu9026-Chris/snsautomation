'use client';

import { useCallback, useState } from 'react';

export interface UploadedFile {
  name: string;
  size: string;
  type: 'video' | 'image';
  url?: string;
  uploading?: boolean;
}

interface UseFileUploadOptions {
  onMediaTypeChange?: (info: { hasVideo: boolean; allImages: boolean }) => void;
}

function fileToPlaceholder(file: File): UploadedFile {
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  const isImage = file.type.startsWith('image/');
  return {
    name: file.name,
    size: `${sizeMB} MB`,
    type: isImage ? 'image' : 'video',
    uploading: true,
  };
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { onMediaTypeChange } = options;
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const notifyMediaType = useCallback(
    (snapshot: UploadedFile[]) => {
      if (snapshot.length === 0) return;
      onMediaTypeChange?.({
        hasVideo: snapshot.some((f) => f.type === 'video'),
        allImages: snapshot.every((f) => f.type === 'image'),
      });
    },
    [onMediaTypeChange]
  );

  const addFiles = useCallback(
    async (incoming: FileList) => {
      const fileArray = Array.from(incoming);
      const placeholders = fileArray.map(fileToPlaceholder);
      let snapshotForNotify: UploadedFile[] = [];

      setFiles((prev) => {
        const next = [...prev, ...placeholders];
        snapshotForNotify = next;
        return next;
      });
      notifyMediaType(snapshotForNotify);

      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);
        let uploadedUrl: string | null = null;
        try {
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            uploadedUrl = data.url ?? null;
          }
        } catch (err) {
          console.error('[useFileUpload] upload failed:', err);
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.uploading
              ? { ...f, url: uploadedUrl ?? undefined, uploading: false }
              : f
          )
        );
      }
    },
    [notifyMediaType]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const replaceFiles = useCallback(
    (next: UploadedFile[]) => {
      setFiles(next);
      notifyMediaType(next);
    },
    [notifyMediaType]
  );

  const appendExternalFiles = useCallback(
    (extra: UploadedFile[]) => {
      setFiles((prev) => {
        const next = [...prev, ...extra];
        notifyMediaType(next);
        return next;
      });
    },
    [notifyMediaType]
  );

  const reset = useCallback(() => setFiles([]), []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) void addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  return {
    files,
    isDragOver,
    addFiles,
    removeFile,
    replaceFiles,
    appendExternalFiles,
    reset,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
