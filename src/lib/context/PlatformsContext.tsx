'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getPlatforms } from '@/lib/queries';
import type { Platform } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

interface PlatformsContextValue {
  platforms: Platform[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const PlatformsContext = createContext<PlatformsContextValue>({
  platforms: [],
  loading: false,
  error: null,
  refresh: async () => {},
});

export function usePlatforms() {
  return useContext(PlatformsContext);
}

export function PlatformsProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return inFlightRef.current;
    setLoading(true);
    setError(null);
    const promise = (async () => {
      try {
        const data = await getPlatforms();
        setPlatforms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load platforms');
      } finally {
        setLoading(false);
        inFlightRef.current = null;
      }
    })();
    inFlightRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setPlatforms([]);
      return;
    }
    void refresh();
  }, [isLoggedIn, refresh]);

  const value = useMemo<PlatformsContextValue>(
    () => ({ platforms, loading, error, refresh }),
    [platforms, loading, error, refresh]
  );

  return <PlatformsContext.Provider value={value}>{children}</PlatformsContext.Provider>;
}
