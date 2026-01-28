import dotenv from 'dotenv';
import { keycloakConfig } from './keycloak.config';

dotenv.config();

const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
];

const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  corsOrigins: corsOrigins.length > 0 ? corsOrigins : defaultCorsOrigins,
  keycloak: keycloakConfig,
};
