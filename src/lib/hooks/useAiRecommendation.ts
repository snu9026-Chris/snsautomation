'use client';

import { useCallback } from 'react';
import { api, ApiError } from '@/lib/services/api';
import type { PlatformId } from '@/types';
import { mockAiRecommendations } from '@/data/mock';
import type { AiPlatformOptions, PlatformData } from './usePublishForm';

interface AiRecommendation {
  title?: string;
  description?: string;
  firstComment?: string;
  titles?: string[];
  firstComments?: string[];
}

interface UseAiRecommendationDeps {
  contentType: string;
  contentDescription: string;
  uploadedFileName?: string;
  setLoadingAi: React.Dispatch<React.SetStateAction<Record<PlatformId, boolean>>>;
  setPlatformData: React.Dispatch<React.SetStateAction<Record<PlatformId, PlatformData>>>;
  setAiOptions?: React.Dispatch<React.SetStateAction<Record<PlatformId, AiPlatformOptions>>>;
  /** true면 호출 실패 시 mock 데이터로 채움 */
  fallbackToMock?: boolean;
}

export function useAiRecommendation(deps: UseAiRecommendationDeps) {
  const {
    contentType,
    contentDescription,
    uploadedFileName,
    setLoadingAi,
    setPlatformData,
    setAiOptions,
    fallbackToMock = false,
  } = deps;

  return useCallback(
    async (platform: PlatformId) => {
      setLoadingAi((prev) => ({ ...prev, [platform]: true }));
      try {
        const rec = await api.post<AiRecommendation>('/api/ai/recommend', {
          platform,
          contentType,
          videoTitle: contentDescription || uploadedFileName || '',
          videoDescription: contentDescription || '',
        });

        setPlatformData((prev) => ({
          ...prev,
          [platform]: {
            title: rec.title || prev[platform].title,
            description: rec.description || prev[platform].description,
            firstComment: rec.firstComment || prev[platform].firstComment,
          },
        }));

        if (setAiOptions) {
          setAiOptions((prev) => ({
            ...prev,
            [platform]: {
              titles: rec.titles || [],
              firstComments: rec.firstComments || [],
            },
          }));
        }
      } catch (err) {
        console.error('[useAiRecommendation] failed:', err);
        if (fallbackToMock && err instanceof ApiError) {
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
        }
      } finally {
        setLoadingAi((prev) => ({ ...prev, [platform]: false }));
      }
    },
    [contentType, contentDescription, uploadedFileName, setLoadingAi, setPlatformData, setAiOptions, fallbackToMock]
  );
}
