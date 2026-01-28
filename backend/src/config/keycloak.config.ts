import dotenv from 'dotenv';

dotenv.config();

const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const keycloakRealm = process.env.KEYCLOAK_REALM || 'mfe-poc';
const keycloakIssuer =
  process.env.KEYCLOAK_ISSUER || `${keycloakUrl}/realms/${keycloakRealm}`;
const keycloakAudience = process.env.KEYCLOAK_AUDIENCE || 'mfe-host-client';

export const keycloakConfig = {
  url: keycloakUrl,
  realm: keycloakRealm,
  issuer: keycloakIssuer,
  audience: keycloakAudience,
  jwksUri: `${keycloakIssuer}/protocol/openid-connect/certs`,
};
