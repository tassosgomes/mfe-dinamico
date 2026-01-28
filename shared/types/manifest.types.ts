import { Role } from './auth.types';

/**
 * Resposta do Manifest Service com remotes autorizados.
 */
export interface ManifestResponse {
  remotes: RemoteConfig[];
  user: ManifestUser;
}

/**
 * Configuração de um remote disponível para o usuário.
 */
export interface RemoteConfig {
  remoteName: string;
  remoteEntry: string;
  exposedModule: string;
  routePath: string;
  navigationLabel: string;
  requiredRoles: Role[];
  icon: string;
  version: string;
  /**
   * Tipo do remote entry.
   * - 'module': ES modules (Vite dev mode ou ESM builds)
   * - 'var': Global variable (Webpack UMD builds)
   */
  type?: 'module' | 'var';
}

/**
 * Dados do usuário retornados junto ao manifesto.
 */
export interface ManifestUser {
  sub: string;
  name: string;
  email: string;
  preferred_username: string;
  roles: Role[];
}

/**
 * Corpo da requisição para o Manifest Service.
 */
export interface ManifestRequest {
  clientInfo?: {
    userAgent?: string;
    screenResolution?: string;
    locale?: string;
  };
}

/**
 * Resposta de erro do Manifest Service.
 */
export interface ManifestErrorResponse {
  error: string;
  error_description: string;
  code:
    | 'INVALID_TOKEN'
    | 'EXPIRED_TOKEN'
    | 'INSUFFICIENT_PERMISSIONS'
    | 'SERVER_ERROR';
}
