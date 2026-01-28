import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import type { SigningKey } from 'jwks-rsa';
import { keycloakConfig } from '../config/keycloak.config';
import type {
  JwtValidationResult,
  KeycloakJwtPayload,
  Role,
  JwtValidationError,
} from '../types';

const validRoles = ['ADMIN', 'SALES', 'USER'] as const;

export class JwtService {
  private client: jwksClient.JwksClient;
  private issuer: string;
  private audience: string;

  constructor() {
    this.issuer = keycloakConfig.issuer;
    this.audience = keycloakConfig.audience;
    this.client = jwksClient({
      jwksUri: keycloakConfig.jwksUri,
      cache: true,
      cacheMaxAge: 600000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  async validateToken(token: string): Promise<JwtValidationResult> {
    try {
      const decodedHeader = jwt.decode(token, { complete: true });
      if (
        !decodedHeader ||
        typeof decodedHeader !== 'object' ||
        !decodedHeader.header?.kid
      ) {
        return { valid: false, error: 'MALFORMED_TOKEN' };
      }

      const signingKey = await this.getSigningKey(decodedHeader.header.kid);

      // Verifica primeiro sem audience (Keycloak public clients não incluem aud)
      const decoded = jwt.verify(token, signingKey, {
        issuer: this.issuer,
        algorithms: ['RS256'],
      }) as KeycloakJwtPayload;

      // Valida audience ou azp (authorized party) manualmente
      // Keycloak usa azp para clientes públicos
      const tokenAudience = decoded.aud;
      const tokenAzp = decoded.azp;

      const validAudience =
        tokenAudience === this.audience ||
        (Array.isArray(tokenAudience) &&
          tokenAudience.includes(this.audience)) ||
        tokenAzp === this.audience;

      if (!validAudience) {
        return { valid: false, error: 'INVALID_AUDIENCE' };
      }

      return { valid: true, payload: decoded };
    } catch (error) {
      return { valid: false, error: this.mapJwtError(error) };
    }
  }

  extractRoles(payload: KeycloakJwtPayload): Role[] {
    const realmRoles = payload.realm_access?.roles ?? [];
    const resourceRoles =
      payload.resource_access?.[this.audience]?.roles ?? [];
    const mergedRoles = Array.from(new Set([...realmRoles, ...resourceRoles]));

    return mergedRoles.filter((role): role is Role =>
      validRoles.includes(role as Role)
    );
  }

  extractUserInfo(payload: KeycloakJwtPayload) {
    return {
      sub: payload.sub,
      name: payload.name ?? payload.preferred_username ?? '',
      email: payload.email ?? '',
      preferred_username: payload.preferred_username ?? '',
    };
  }

  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.getSigningKey(
        kid,
        (err: Error | null, key: SigningKey | undefined) => {
          if (err || !key) {
            reject(err || new Error('Signing key not found'));
            return;
          }
          resolve(key.getPublicKey());
        }
      );
    });
  }

  private mapJwtError(error: unknown): JwtValidationError {
    if (error instanceof jwt.TokenExpiredError) {
      return 'EXPIRED_TOKEN';
    }

    const err = error as { name?: string; message?: string } | null;
    if (!err || !err.message) {
      return 'MALFORMED_TOKEN';
    }

    if (err.message.includes('invalid signature')) {
      return 'INVALID_SIGNATURE';
    }
    if (err.message.includes('issuer')) {
      return 'INVALID_ISSUER';
    }
    if (err.message.includes('audience')) {
      return 'INVALID_AUDIENCE';
    }
    if (err.message.includes('jwt malformed')) {
      return 'MALFORMED_TOKEN';
    }

    if (err.name === 'JsonWebTokenError') {
      return 'MALFORMED_TOKEN';
    }

    return 'MALFORMED_TOKEN';
  }
}
