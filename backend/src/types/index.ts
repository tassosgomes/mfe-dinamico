import type { Request } from 'express';
import type { RemoteConfig, Role } from '../../../shared/types';

export type { RemoteConfig, Role } from '../../../shared/types';

export interface KeycloakJwtPayload {
  exp: number;
  iat: number;
  iss: string;
  aud: string | string[];
  sub: string;
  typ?: string;
  azp?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
  scope?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
}

export type JwtValidationError =
  | 'INVALID_SIGNATURE'
  | 'EXPIRED_TOKEN'
  | 'INVALID_ISSUER'
  | 'INVALID_AUDIENCE'
  | 'MALFORMED_TOKEN';

export interface JwtValidationResult {
  valid: boolean;
  payload?: KeycloakJwtPayload;
  error?: JwtValidationError;
}

export interface RemoteConfigEntry extends RemoteConfig {
  enabled: boolean;
}

export interface AuthenticatedUser {
  sub: string;
  name: string;
  email: string;
  preferred_username: string;
  roles: Role[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
