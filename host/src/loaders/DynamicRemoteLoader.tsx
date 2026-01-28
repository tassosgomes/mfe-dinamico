import { lazy, Suspense, useMemo } from 'react';
import type { ComponentType } from 'react';
import { loadRemote } from '@module-federation/enhanced/runtime';
import type { RemoteAppProps } from '@mfe/shared';
import { useAuthContext } from '../contexts/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RemoteLoadError, RemoteTimeoutError } from '../utils/errors';

interface DynamicRemoteLoaderProps {
  remoteName: string;
  remoteEntry: string;
  moduleName: string;
  routePath: string;
  timeoutMs?: number;
}

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeModuleName(moduleName: string): string {
  return moduleName.startsWith('./') ? moduleName.slice(2) : moduleName;
}

async function loadWithTimeout<T>(promise: Promise<T>, timeoutMs: number, remoteName: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new RemoteTimeoutError(remoteName, timeoutMs)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function loadRemoteModule({
  remoteName,
  moduleName,
  timeoutMs,
}: {
  remoteName: string;
  moduleName: string;
  timeoutMs: number;
}) {
  const normalizedModuleName = normalizeModuleName(moduleName);
  const requestKey = `${remoteName}/${normalizedModuleName}`;
  const remoteModule = await loadWithTimeout(loadRemote(requestKey), timeoutMs, remoteName);

  if (!remoteModule) {
    throw new RemoteLoadError('Módulo remoto não encontrado.', {
      remoteName,
      code: 'load_failed',
    });
  }

  return remoteModule as { default?: ComponentType<RemoteAppProps> };
}

async function loadRemoteWithRetry({
  remoteName,
  moduleName,
  timeoutMs,
}: {
  remoteName: string;
  moduleName: string;
  timeoutMs: number;
}) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await loadRemoteModule({ remoteName, moduleName, timeoutMs });
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES - 1) {
        await delay(INITIAL_DELAY * Math.pow(2, attempt));
      }
    }
  }

  throw (
    lastError ??
    new RemoteLoadError('Falha ao carregar remote.', { remoteName, code: 'load_failed' })
  );
}

export function DynamicRemoteLoader({
  remoteName,
  remoteEntry,
  moduleName,
  routePath,
  timeoutMs = 10000,
}: DynamicRemoteLoaderProps) {
  const authContext = useAuthContext();

  const LazyComponent = useMemo(
    () =>
      lazy(async () => {
        if (!remoteEntry) {
          throw new RemoteLoadError('Remote entry inválido.', {
            remoteName,
            code: 'init_failed',
          });
        }

        const module = await loadRemoteWithRetry({ remoteName, moduleName, timeoutMs });
        if (!module.default) {
          throw new RemoteLoadError('Remote não exportou componente padrão.', {
            remoteName,
            code: 'load_failed',
          });
        }

        return { default: module.default };
      }),
    [remoteEntry, remoteName, moduleName, timeoutMs]
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner label="Carregando remote..." />}>
        <LazyComponent authContext={authContext} basename={routePath} />
      </Suspense>
    </ErrorBoundary>
  );
}
