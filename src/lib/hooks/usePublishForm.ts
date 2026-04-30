'use client';

import { useCallback, useMemo, useState } from 'react';
import type { PlatformId } from '@/types';
import { usePlatforms } from '@/lib/context/PlatformsContext';

export interface PlatformData {
  title: string;
  description: string;
  firstComment: string;
}

export interface TikTokOptions {
  privacyLevel: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY';
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  brandContentToggle: boolean;
  brandOrganicToggle: boolean;
}

export interface AiPlatformOptions {
  titles: string[];
  firstComments: string[];
}

export const PLATFORM_IDS: PlatformId[] = ['youtube', 'instagram', 'threads', 'tiktok', 'x'];

export const DEFAULT_TIKTOK_OPTIONS: TikTokOptions = {
  privacyLevel: 'PUBLIC_TO_EVERYONE',
  disableComment: false,
  disableDuet: false,
  disableStitch: false,
  brandContentToggle: false,
  brandOrganicToggle: false,
};

function emptyPlatformData(): Record<PlatformId, PlatformData> {
  return PLATFORM_IDS.reduce((acc, id) => {
    acc[id] = { title: '', description: '', firstComment: '' };
    return acc;
  }, {} as Record<PlatformId, PlatformData>);
}

function emptyBoolMap(): Record<PlatformId, boolean> {
  return PLATFORM_IDS.reduce((acc, id) => {
    acc[id] = false;
    return acc;
  }, {} as Record<PlatformId, boolean>);
}

function emptyAiOptions(): Record<PlatformId, AiPlatformOptions> {
  return PLATFORM_IDS.reduce((acc, id) => {
    acc[id] = { titles: [], firstComments: [] };
    return acc;
  }, {} as Record<PlatformId, AiPlatformOptions>);
}

interface UsePublishFormOptions {
  /** true면 평소 모든 연결된 플랫폼을 자동으로 켠 채 시작 (publish 페이지) */
  autoSelectConnected?: boolean;
}

export function usePublishForm(options: UsePublishFormOptions = {}) {
  const { autoSelectConnected = true } = options;
  const { platforms } = usePlatforms();

  const connectedPlatforms = useMemo(
    () => new Set(platforms.filter((p) => p.status === 'connected').map((p) => p.id)),
    [platforms]
  );

  const [contentType, setContentType] = useState('daily');
  const [contentDescription, setContentDescription] = useState('');
  const [instagramFormat, setInstagramFormat] = useState<'reel' | 'post'>('post');
  const [tiktokOptions, setTiktokOptions] = useState<TikTokOptions>(DEFAULT_TIKTOK_OPTIONS);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<PlatformId, boolean>>(emptyBoolMap);
  const [platformData, setPlatformData] = useState<Record<PlatformId, PlatformData>>(emptyPlatformData);
  const [loadingAi, setLoadingAi] = useState<Record<PlatformId, boolean>>(emptyBoolMap);
  const [aiOptions, setAiOptions] = useState<Record<PlatformId, AiPlatformOptions>>(emptyAiOptions);

  const initSelectionFromConnected = useCallback(() => {
    if (!autoSelectConnected) return;
    setSelectedPlatforms(() => {
      const next = emptyBoolMap();
      PLATFORM_IDS.forEach((id) => {
        next[id] = connectedPlatforms.has(id);
      });
      return next;
    });
  }, [autoSelectConnected, connectedPlatforms]);

  const togglePlatform = useCallback(
    (id: PlatformId) => {
      if (!connectedPlatforms.has(id)) return;
      setSelectedPlatforms((prev) => ({ ...prev, [id]: !prev[id] }));
    },
    [connectedPlatforms]
  );

  const setSelectedPlatformsBy = useCallback(
    (predicate: (id: PlatformId) => boolean) => {
      setSelectedPlatforms(() => {
        const next = emptyBoolMap();
        PLATFORM_IDS.forEach((id) => {
          next[id] = predicate(id);
        });
        return next;
      });
    },
    []
  );

  const updateField = useCallback(
    (platform: PlatformId, field: keyof PlatformData, value: string) => {
      setPlatformData((prev) => ({
        ...prev,
        [platform]: { ...prev[platform], [field]: value },
      }));
    },
    []
  );

  const onMediaTypeChange = useCallback((info: { hasVideo: boolean; allImages: boolean }) => {
    if (info.hasVideo) {
      setSelectedPlatforms((prev) => ({ ...prev, x: false }));
    }
    if (info.allImages) {
      setSelectedPlatforms((prev) => ({ ...prev, youtube: false, tiktok: false }));
    }
  }, []);

  const reset = useCallback(() => {
    setPlatformData(emptyPlatformData());
    setAiOptions(emptyAiOptions());
    setContentDescription('');
    setContentType('daily');
    setInstagramFormat('post');
    setTiktokOptions(DEFAULT_TIKTOK_OPTIONS);
  }, []);

  const activePlatforms = useMemo(
    () => PLATFORM_IDS.filter((id) => selectedPlatforms[id]),
    [selectedPlatforms]
  );

  return {
    // state
    platforms,
    connectedPlatforms,
    contentType,
    contentDescription,
    instagramFormat,
    tiktokOptions,
    selectedPlatforms,
    platformData,
    loadingAi,
    aiOptions,
    activePlatforms,

    // setters
    setContentType,
    setContentDescription,
    setInstagramFormat,
    setTiktokOptions,
    setSelectedPlatforms,
    setPlatformData,
    setLoadingAi,
    setAiOptions,

    // actions
    togglePlatform,
    updateField,
    initSelectionFromConnected,
    setSelectedPlatformsBy,
    onMediaTypeChange,
    reset,
  };
}
