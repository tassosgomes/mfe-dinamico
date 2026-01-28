import type {
  ManifestErrorResponse,
  ManifestRequest,
  ManifestResponse,
} from '@mfe/shared';
import { ManifestServiceError } from '../utils/errors';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRequestPayload(): ManifestRequest {
  return {
    clientInfo: {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      locale: navigator.language,
    },
  };
}

function resolveErrorKind(status?: number, errorCode?: ManifestErrorResponse['code']): ManifestServiceError {
  if (status === 401 || errorCode === 'INVALID_TOKEN' || errorCode === 'EXPIRED_TOKEN') {
    return new ManifestServiceError('Token inválido.', { kind: 'unauthorized', status, code: errorCode });
  }
  if (status === 403 || errorCode === 'INSUFFICIENT_PERMISSIONS') {
    return new ManifestServiceError('Permissões insuficientes.', { kind: 'forbidden', status, code: errorCode });
  }
  if (status && status >= 500) {
    return new ManifestServiceError('Erro interno do servidor.', { kind: 'server', status, code: errorCode });
  }
  return new ManifestServiceError('Erro desconhecido.', { kind: 'unknown', status, code: errorCode });
}

async function parseErrorResponse(response: Response): Promise<ManifestErrorResponse | null> {
  try {
    return (await response.json()) as ManifestErrorResponse;
  } catch {
    return null;
  }
}

export async function fetchManifest(accessToken: string): Promise<ManifestResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch('/api/config/remotes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildRequestPayload()),
      });

      if (!response.ok) {
        const errorBody = await parseErrorResponse(response);
        throw resolveErrorKind(response.status, errorBody?.code);
      }

      return (await response.json()) as ManifestResponse;
    } catch (error) {
      const normalizedError =
        error instanceof ManifestServiceError
          ? error
          : new ManifestServiceError('Falha de rede.', { kind: 'network' });
      lastError = normalizedError;

      if (attempt < MAX_RETRIES - 1) {
        await delay(INITIAL_DELAY * Math.pow(2, attempt));
      }
    }
  }

  throw lastError ?? new ManifestServiceError('Falha ao carregar manifesto.', { kind: 'unknown' });
}
