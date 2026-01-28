/**
 * Perfil do usuário autenticado retornado pelo Keycloak.
 */
export interface UserProfile {
  /** Identificador único do usuário no Keycloak. */
  sub: string;
  /** Nome completo do usuário. */
  name: string;
  /** E-mail do usuário. */
  email: string;
  /** Nome de usuário preferencial. */
  preferred_username: string;
  /** Roles atribuídas ao usuário. */
  roles: Role[];
}

/**
 * Roles suportadas no contexto da POC.
 */
export type Role = 'ADMIN' | 'SALES' | 'USER';

/**
 * Tokens OIDC/JWT usados pelo cliente.
 */
export interface AuthTokens {
  /** ID token JWT. */
  id_token: string;
  /** Access token JWT. */
  access_token: string;
  /** Refresh token JWT. */
  refresh_token: string;
  /** Timestamp de expiração (epoch ms). */
  expires_at: number;
}

/**
 * Contexto de autenticação compartilhado entre host e remotes.
 */
export interface AuthContext {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  getAccessToken: () => Promise<string>;
  getIdToken: () => string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  onAuthEvent: (handler: AuthEventHandler) => () => void;
  emitAuthEvent: (event: AuthEvent) => void;
}

export type AuthEventType =
  | 'login'
  | 'logout'
  | 'token_refreshed'
  | 'access_denied'
  | 'error';

/**
 * Evento emitido pelo event bus de autenticação.
 */
export interface AuthEvent {
  type: AuthEventType;
  timestamp: number;
  data?: unknown;
}

export type AuthEventHandler = (event: AuthEvent) => void;
