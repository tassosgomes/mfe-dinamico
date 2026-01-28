import type { ManifestErrorResponse } from '@mfe/shared';

export type ManifestErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'server'
  | 'unknown';

export class ManifestServiceError extends Error {
  readonly kind: ManifestErrorKind;
  readonly status?: number;
  readonly code?: ManifestErrorResponse['code'];

  constructor(message: string, options: { kind: ManifestErrorKind; status?: number; code?: ManifestErrorResponse['code'] }) {
    super(message);
    this.name = 'ManifestServiceError';
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code;
  }
}

export type RemoteLoadErrorCode = 'timeout' | 'load_failed' | 'init_failed';

export class RemoteLoadError extends Error {
  readonly remoteName: string;
  readonly code: RemoteLoadErrorCode;

  constructor(message: string, options: { remoteName: string; code: RemoteLoadErrorCode }) {
    super(message);
    this.name = 'RemoteLoadError';
    this.remoteName = options.remoteName;
    this.code = options.code;
  }
}

export class RemoteTimeoutError extends RemoteLoadError {
  readonly timeoutMs: number;

  constructor(remoteName: string, timeoutMs: number) {
    super(`Tempo limite excedido ao carregar o remote ${remoteName}.`, {
      remoteName,
      code: 'timeout',
    });
    this.name = 'RemoteTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export function buildManifestErrorMessage(error: ManifestServiceError): string {
  switch (error.kind) {
    case 'network':
      return 'Falha de rede ao carregar o manifesto. Verifique sua conexão.';
    case 'unauthorized':
      return 'Sessão expirada ou inválida. Faça login novamente.';
    case 'forbidden':
      return 'Acesso negado. Você não possui permissões para acessar os remotes.';
    case 'server':
      return 'Erro no serviço de manifesto. Tente novamente em instantes.';
    default:
      return 'Não foi possível carregar o manifesto.';
  }
}

export function buildRemoteErrorMessage(error: RemoteLoadError): string {
  if (error.code === 'timeout') {
    return `Tempo esgotado ao carregar o remote ${error.remoteName}.`;
  }
  if (error.code === 'init_failed') {
    return `Não foi possível inicializar o remote ${error.remoteName}.`;
  }
  return `Falha ao carregar o remote ${error.remoteName}.`;
}

export function resolveErrorMessage(error: unknown): string {
  if (error instanceof ManifestServiceError) {
    return buildManifestErrorMessage(error);
  }
  if (error instanceof RemoteLoadError) {
    return buildRemoteErrorMessage(error);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado.';
}
