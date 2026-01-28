import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ManifestResponse } from '@mfe/shared';
import { useAuthContext } from './AuthContext';
import { fetchManifest } from '../services/manifest.service';
import { ManifestServiceError } from '../utils/errors';
import { initializeFederation } from '../utils/moduleFederation';

interface ManifestContextValue {
  manifest: ManifestResponse | null;
  isLoading: boolean;
  error: ManifestServiceError | null;
  reload: () => Promise<void>;
}

const ManifestContext = createContext<ManifestContextValue | undefined>(undefined);

interface ManifestProviderProps {
  children: React.ReactNode;
}

export function ManifestProvider({ children }: ManifestProviderProps) {
  const { isAuthenticated, isLoading: isAuthLoading, getAccessToken } = useAuthContext();
  const [manifest, setManifest] = useState<ManifestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ManifestServiceError | null>(null);

  const loadManifest = useCallback(async () => {
    if (!isAuthenticated) {
      setManifest(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetchManifest(token);
      setManifest(response);
      initializeFederation(response.remotes);
    } catch (err) {
      setManifest(null);
      setError(err instanceof ManifestServiceError ? err : new ManifestServiceError('Erro desconhecido.', { kind: 'unknown' }));
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      setManifest(null);
      setError(null);
      return;
    }

    void loadManifest();
  }, [isAuthLoading, isAuthenticated, loadManifest]);

  const value = useMemo<ManifestContextValue>(
    () => ({
      manifest,
      isLoading,
      error,
      reload: loadManifest,
    }),
    [manifest, isLoading, error, loadManifest]
  );

  return <ManifestContext.Provider value={value}>{children}</ManifestContext.Provider>;
}

export function useManifestContext(): ManifestContextValue {
  const context = useContext(ManifestContext);
  if (!context) {
    throw new Error('useManifestContext deve ser usado dentro de ManifestProvider');
  }
  return context;
}
