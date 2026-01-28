# Technical Specification
## MFE RBAC POC - Micro-Frontends com Module Federation e Role-Based Access Control

**Versão:** 1.1
**Data:** 27 de Janeiro de 2026
**Status:** Draft
**Autor:** Tassio Gomes
**PRD Referência:** docs/prd/mfe-rbac-poc-prd.md

---

## Resumo Executivo

Esta Tech Spec define a implementação de uma prova de conceito (POC) de arquitetura production-grade de micro-frontends com carregamento dinâmico baseado em RBAC. A solução utiliza Module Federation 2.0 Runtime API para carregar remotes sob demanda, Keycloak como Identity Provider OIDC, e um Backend Node.js/Express como Manifest Service central.

A arquitetura implementa defesa em profundidade com validacao em múltiplas camadas: Network (remotes nao autorizados nunca sao solicitados), Backend (validacao JWT com JWKS), Host (tokens em memoria) e cada Remote (validacao propria de roles).

**Decisoes arquiteturais principais:**
- Module Federation Runtime API dinamico via @module-federation/enhanced
- Token storage em memoria com silent refresh automatico
- Auth context compartilhado via Props Drilling + Event Bus
- JWT validacao com JWKS (RS256, sem secret sharing)
- Docker Compose para orchestracao local

---

## Arquitetura do Sistema

### Visao Geral dos Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                            │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                     Host Application (React 18 + Vite)        │ │
│  │  OIDC Client │ Dynamic Loader │ React Router v6 │ Auth Context│ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│         ┌────────────────────┼────────────────────┐               │
│         ▼                    ▼                    ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │Admin Remote  │    │Sales Remote  │    │User Remote   │        │
│  │  (ADMIN)     │    │(SALES/ADMIN) │    │  (All Users) │        │
│  └──────────────┘    └──────────────┘    └──────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    HTTPS (OIDC + API)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                           │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐   │
│  │  Keycloak 24.x      │    │  Backend API (Node.js 20 LTS)   │   │
│  │  OIDC Provider      │    │  - POST /api/config/remotes     │   │
│  │  JWT RS256          │    │  - JWT Validation (JWKS)        │   │
│  │  Realm: mfe-poc     │    │  - RBAC Filtering               │   │
│  └─────────────────────┘    └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Componentes e responsabilidades:**

| Componente | Stack | Responsabilidade Principal |
|------------|-------|---------------------------|
| **Host App** | React 18, Vite 5, React Router v6, @module-federation/enhanced, oidc-client-ts | Orquestrador de MFEs, autenticacao OIDC, menu dinamico, carregamento de remotes |
| **Backend API** | Node.js 20, TypeScript, Express 4, jsonwebtoken, jwks-rsa, cors, helmet | Manifest Service, validacao JWT, filtragem RBAC, health checks |
| **Keycloak** | Docker Image 24.x | Identity Provider OIDC, gerenciamento de usuarios/roles, tokens JWT |
| **Admin Remote** | React 18, Vite 5, @module-federation/enhanced | Dashboard administrativo, requer role ADMIN |
| **Sales Remote** | React 18, Vite 5, @module-federation/enhanced | Dashboard de vendas, requer role SALES ou ADMIN |
| **User Remote** | React 18, Vite 5, @module-federation/enhanced | Perfil de usuario, acessivel a todos autenticados |

**Fluxo de dados principal:**
1. Usuario acessa Host App → redirect para Keycloak
2. Keycloak retorna auth code → Host troca por tokens (id/access/refresh)
3. Host chama POST /api/config/remotes com access_token
4. Backend valida JWT via JWKS, extrai roles, retorna manifesto
5. Host inicializa Module Federation Runtime com remotes autorizados
6. Host renderiza menu dinamico e registra rotas React Router
7. Usuario navega → Dynamic Loader carrega remote sob demanda (lazy loading)

---

## Design de Implementacao

### Estrutura de Diretorios

> **IMPORTANTE:** Cada projeto deve ser criado em sua respectiva pasta na raiz do repositório:
> - `host/` - Host Application
> - `backend/` - Backend API (Manifest Service)
> - `admin-remote/` - Admin Remote (ADMIN only)
> - `sales-remote/` - Sales Remote (SALES or ADMIN)
> - `user-remote/` - User Remote (All authenticated)

```
mfe-dinamico/
├── host/                         # Host Application
│   ├── src/
│   │   ├── auth/                 # OIDC client, token manager
│   │   ├── components/           # Layout, menu, error boundaries
│   │   ├── loaders/              # Dynamic Remote Loader
│   │   ├── contexts/             # AuthContext, ManifestContext
│   │   ├── pages/                # Home, NotFound, AccessDenied
│   │   ├── utils/                # Event bus, helpers
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                      # Backend Node.js/Express (Manifest Service)
│   ├── src/
│   │   ├── routes/               # API routes
│   │   │   ├── config.routes.ts
│   │   │   └── health.routes.ts
│   │   ├── middleware/           # Auth, CORS, error handling
│   │   │   ├── auth.middleware.ts
│   │   │   ├── cors.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── services/             # Business logic
│   │   │   ├── jwt.service.ts
│   │   │   └── manifest.service.ts
│   │   ├── config/               # App configuration
│   │   │   ├── index.ts
│   │   │   ├── remotes.config.ts
│   │   │   └── keycloak.config.ts
│   │   ├── types/                # TypeScript types
│   │   │   └── index.ts
│   │   ├── utils/                # Helpers
│   │   │   └── logger.ts
│   │   └── server.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── admin-remote/                 # Admin Remote (ADMIN only)
│   ├── src/
│   │   ├── components/           # UsersList, SystemSettings
│   │   ├── pages/                # Dashboard, Users, Settings
│   │   ├── guards/               # RoleGuard component
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── sales-remote/                 # Sales Remote (SALES or ADMIN)
│   ├── src/
│   │   ├── components/           # SalesChart, RankingTable
│   │   ├── pages/                # Dashboard, Reports
│   │   ├── guards/               # RoleGuard component
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── user-remote/                  # User Remote (All authenticated)
│   ├── src/
│   │   ├── components/           # ProfileForm, UserInfo
│   │   ├── pages/                # Profile, EditProfile
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── infrastructure/
│   ├── keycloak/                 # Keycloak configuration
│   │   ├── realm-export.json     # Realm import file
│   │   ├── themes/               # Custom themes (optional)
│   │   └── setup-script.js       # Automated setup script
│   │
│   └── docker/
│       ├── docker-compose.yml    # Full stack orchestration
│       ├── .env.example          # Environment variables template
│       └── nginx/                # Nginx configs (production)
│           ├── host.conf
│           ├── admin.conf
│           ├── sales.conf
│           └── user.conf
│
├── shared/                       # Shared code
│   └── types/
│       ├── auth.types.ts         # Auth context interfaces
│       ├── manifest.types.ts     # Manifest response types
│       └── remote.types.ts       # Remote configuration types
│
├── docs/
│   ├── prd/
│   │   └── mfe-rbac-poc-prd.md
│   ├── architecture/
│   │   ├── system-architecture.md
│   │   └── adr.md
│   └── techspec/
│       └── mfe-rbac-poc-techspec.md  # This document
│
├── templates/
│   ├── techspec-template.md
│   ├── prd-template.md
│   ├── task-template.md
│   └── tasks-template.md
│
├── .env.example
├── docker-compose.yml
├── package.json                  # Root package (workspaces)
├── tsconfig.base.json
└── README.md
```

---

## Design de Implementacao

### Interfaces Principais

#### 1. AuthContext Interface (shared/types/auth.types.ts)

Interface compartilhada entre Host e Remotes para contexto de autenticacao.

```typescript
// shared/types/auth.types.ts

export interface UserProfile {
  sub: string;                    // User ID from Keycloak
  name: string;                   // Full name
  email: string;                  // Email address
  preferred_username: string;     // Username
  roles: Role[];                  // User roles
}

export type Role = 'ADMIN' | 'SALES' | 'USER';

export interface AuthTokens {
  id_token: string;               // JWT ID token
  access_token: string;           // JWT access token
  refresh_token: string;          // Refresh token
  expires_at: number;             // Expiration timestamp (ms)
}

export interface AuthContext {
  // Estado
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Metodos
  getAccessToken: () => Promise<string>;
  getIdToken: () => string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;

  // Event Bus
  onAuthEvent: (handler: AuthEventHandler) => () => void;
  emitAuthEvent: (event: AuthEvent) => void;
}

export type AuthEventType = 'login' | 'logout' | 'token_refreshed' | 'access_denied' | 'error';

export interface AuthEvent {
  type: AuthEventType;
  timestamp: number;
  data?: unknown;
}

export type AuthEventHandler = (event: AuthEvent) => void;
```

#### 2. Manifest Types (shared/types/manifest.types.ts)

```typescript
// shared/types/manifest.types.ts

import { Role } from './auth.types';

export interface ManifestResponse {
  remotes: RemoteConfig[];
  user: ManifestUser;
}

export interface RemoteConfig {
  remoteName: string;             // Ex: "admin_app"
  remoteEntry: string;            // Ex: "https://admin.mfe.local/remoteEntry.js"
  exposedModule: string;          // Ex: "./AdminApp"
  routePath: string;              // Ex: "/admin"
  navigationLabel: string;        // Ex: "Administração"
  requiredRoles: Role[];          // Ex: ["ADMIN"]
  icon: string;                   // Icon identifier
  version: string;                // Semantic version
}

export interface ManifestUser {
  sub: string;
  name: string;
  email: string;
  preferred_username: string;
  roles: Role[];
}

// Request body para POST /api/config/remotes
export interface ManifestRequest {
  clientInfo?: {
    userAgent?: string;
    screenResolution?: string;
    locale?: string;
  };
}

// Error response
export interface ManifestErrorResponse {
  error: string;
  error_description: string;
  code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'INSUFFICIENT_PERMISSIONS' | 'SERVER_ERROR';
}
```

#### 3. Remote Loader Interface (shared/types/remote.types.ts)

```typescript
// shared/types/remote.types.ts

import { ComponentType } from 'react';
import { AuthContext } from './auth.types';

export interface RemoteLoaderProps {
  remoteName: string;             // Nome do remote para carregar
  moduleName: string;             // Modulo exposto (ex: "./AdminApp")
  routePath: string;              // Caminho da rota (ex: "/admin")
  fallback?: ComponentType;       // Componente de loading
  errorComponent?: ComponentType; // Componente de erro
}

export interface RemoteModuleLoader {
  load: (props: RemoteLoaderProps) => Promise<ComponentType>;
  retry: (props: RemoteLoaderProps) => Promise<ComponentType>;
  preload: (remoteName: string) => Promise<void>;
}

export interface LoadedRemote {
  component: ComponentType;
  loadTime: number;
  timestamp: number;
}

// Interface que remotes devem implementar para receber props
export interface RemoteAppProps {
  authContext: AuthContext;
  basename: string;               // Base path para rotas relativas
}
```

#### 4. Backend Types (backend/src/types/index.ts)

```typescript
// backend/src/types/index.ts

import { Role } from '../../../shared/types/auth.types';

// Keycloak JWT payload structure
export interface KeycloakJwtPayload {
  exp: number;
  iat: number;
  auth_time: number;
  jti: string;
  iss: string;                    // Issuer (Keycloak realm URL)
  aud: string[];                  // Audience
  sub: string;                    // Subject (user ID)
  typ: string;                    // Token type
  azp: string;                    // Authorized party
  acr: string;
  realm_access: {
    roles: Role[];
  };
  resource_access: {
    [client: string]: {
      roles: Role[];
    };
  };
  scope: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
}

// Remote configuration (server-side)
export interface RemoteConfigEntry {
  remoteName: string;
  remoteEntry: string;
  exposedModule: string;
  routePath: string;
  navigationLabel: string;
  requiredRoles: Role[];
  icon: string;
  version: string;
  enabled: boolean;               // Enable/disable without removing config
}

// Express request with authenticated user
export interface AuthenticatedRequest extends Express.Request {
  user: {
    sub: string;
    name: string;
    email: string;
    preferred_username: string;
    roles: Role[];
  };
}
```

#### 5. JWT Service Interface (backend/src/services/jwt.service.ts)

```typescript
// backend/src/services/jwt.service.ts

import { KeycloakJwtPayload, Role } from '../types';

export interface JwtValidationResult {
  valid: boolean;
  payload?: KeycloakJwtPayload;
  error?: JwtValidationError;
}

export type JwtValidationError =
  | 'INVALID_SIGNATURE'
  | 'EXPIRED_TOKEN'
  | 'INVALID_ISSUER'
  | 'INVALID_AUDIENCE'
  | 'MALFORMED_TOKEN';

export interface IJwtService {
  validateToken(token: string): Promise<JwtValidationResult>;
  extractRoles(payload: KeycloakJwtPayload): Role[];
  extractUserInfo(payload: KeycloakJwtPayload): {
    sub: string;
    name: string;
    email: string;
    preferred_username: string;
  };
}
```

#### 6. Manifest Service Interface (backend/src/services/manifest.service.ts)

```typescript
// backend/src/services/manifest.service.ts

import { Role, RemoteConfigEntry } from '../types';

export interface IManifestService {
  getAuthorizedRemotes(userRoles: Role[]): RemoteConfigEntry[];
  getAllRemotes(): RemoteConfigEntry[];
  userHasAccessToRemote(requiredRoles: Role[], userRoles: Role[]): boolean;
}
```

---

### Modelos de Dados

#### Manifest Response Schema

```typescript
// Response de POST /api/config/remotes
interface ManifestResponse {
  remotes: Array<{
    remoteName: string;        // "admin_app" | "sales_app" | "user_app"
    remoteEntry: string;       // URL completa do remoteEntry.js
    exposedModule: string;     // "./AdminApp" | "./SalesApp" | "./UserApp"
    routePath: string;         // "/admin" | "/sales" | "/user"
    navigationLabel: string;   // Label para o menu
    requiredRoles: Role[];     // Roles necessarias (vazio = todos)
    icon: string;              // Identificador de icone
    version: string;           // "1.0.0"
  }>;
  user: {
    sub: string;
    name: string;
    email: string;
    preferred_username: string;
    roles: Role[];
  };
}
```

#### Keycloak Token Structure

```typescript
// Access Token payload (decoded JWT)
interface KeycloakAccessToken {
  // Header
  // {
  //   "alg": "RS256",
  //   "typ": "JWT",
  //   "kid": "key-id"
  // }

  // Payload
  exp: number;                    // Expiration timestamp
  iat: number;                    // Issued at timestamp
  auth_time: number;              // Authentication time
  jti: string;                    // JWT ID
  iss: string;                    // "https://keycloak.local/realms/mfe-poc"
  aud: string[];                  // ["mfe-host-client"]
  sub: string;                    // User unique ID
  typ: "Bearer";
  azp: string;                    // "mfe-host-client" (authorized party)
  acr: "1";
  realm_access: {
    roles: Role[];                // ["ADMIN"] | ["SALES"] | ["USER"]
  };
  resource_access: {
    "mfe-host-client": {
      roles: Role[];
    };
  };
  scope: "openid profile email";
  email_verified: true;
  name: string;                   // "João Silva"
  preferred_username: string;     // "jsilva"
  given_name: string;             // "João"
  family_name: string;            // "Silva"
  email: string;                  // "joao@corp.com"
}
```

#### Remote Configuration Database (in-memory for POC)

```typescript
// backend/src/config/remotes.config.ts

const REMOTES_CONFIG: RemoteConfigEntry[] = [
  {
    remoteName: 'admin_app',
    remoteEntry: 'https://admin.mfe.local/remoteEntry.js',
    exposedModule: './AdminApp',
    routePath: '/admin',
    navigationLabel: 'Administração',
    requiredRoles: ['ADMIN'],
    icon: 'shield',
    version: '1.0.0',
    enabled: true,
  },
  {
    remoteName: 'sales_app',
    remoteEntry: 'https://sales.mfe.local/remoteEntry.js',
    exposedModule: './SalesApp',
    routePath: '/sales',
    navigationLabel: 'Vendas',
    requiredRoles: ['SALES', 'ADMIN'],
    icon: 'chart',
    version: '1.0.0',
    enabled: true,
  },
  {
    remoteName: 'user_app',
    remoteEntry: 'https://user.mfe.local/remoteEntry.js',
    exposedModule: './UserApp',
    routePath: '/user',
    navigationLabel: 'Meu Perfil',
    // requiredRoles: [] significa que qualquer usuário autenticado tem acesso
    // A lógica no ManifestService deve tratar: if (requiredRoles.length === 0) return true;
    requiredRoles: [],
    icon: 'user',
    version: '1.0.0',
    enabled: true,
  },
];
```

---

### Endpoints de API

#### POST /api/config/remotes

Retorna manifesto de remotes autorizados baseado nas roles do usuario.

**Request:**
```http
POST /api/config/remotes HTTP/1.1
Host: api.mfe.local
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6I...
Content-Type: application/json

{
  "clientInfo": {
    "userAgent": "Mozilla/5.0...",
    "screenResolution": "1920x1080",
    "locale": "pt-BR"
  }
}
```

**Response 200 OK:**
```json
{
  "remotes": [
    {
      "remoteName": "admin_app",
      "remoteEntry": "https://admin.mfe.local/remoteEntry.js",
      "exposedModule": "./AdminApp",
      "routePath": "/admin",
      "navigationLabel": "Administração",
      "requiredRoles": ["ADMIN"],
      "icon": "shield",
      "version": "1.0.0"
    }
  ],
  "user": {
    "sub": "user-id-123",
    "name": "Ana Admin",
    "email": "ana@corp.com",
    "preferred_username": "aadmin",
    "roles": ["ADMIN"]
  }
}
```

**Response 401 Unauthorized:**
```json
{
  "error": "invalid_token",
  "error_description": "Token is expired or invalid",
  "code": "EXPIRED_TOKEN"
}
```

**Response 403 Forbidden:**
```json
{
  "error": "insufficient_permissions",
  "error_description": "User has no valid roles assigned",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

#### GET /health

Health check endpoint para orquestradores e load balancers.

**Request:**
```http
GET /health HTTP/1.1
Host: api.mfe.local
```

**Response 200 OK:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T12:00:00Z",
  "uptime": 3600,
  "services": {
    "database": "ok",
    "keycloak": "ok"
  }
}
```

---

## Pontos de Integracao

### 1. Keycloak OIDC Integration

**Configuracao:**
- **URL:** http://keycloak.local:8080 (local) / https://keycloak.example.com (prod)
- **Realm:** mfe-poc
- **Client ID:** mfe-host-client
- **Client Secret:** ${KEYCLOAK_CLIENT_SECRET} (environment variable)
- **Redirect URIs:** http://localhost:5173/* (dev), https://host.mfe.local/* (prod)
- **Scopes:** openid, profile, email

**Authorization Code Flow:**
```
1. Host redirects to:
   https://keycloak.local/realms/mfe-poc/protocol/openid-connect/auth
     ?client_id=mfe-host-client
     &redirect_uri=http://localhost:5173/callback
     &response_type=code
     &scope=openid profile email
     &state=random_state_value
     &code_challenge=sha256_hash_of_verifier  // PKCE challenge
     &code_challenge_method=S256

2. User authenticates at Keycloak

3. Keycloak redirects back with code:
   http://localhost:5173/callback?code=auth_code&state=random_state_value

4. Host exchanges code for tokens:
   POST https://keycloak.local/realms/mfe-poc/protocol/openid-connect/token
   Content-Type: application/x-www-form-urlencoded
   grant_type=authorization_code
   &code=auth_code
   &redirect_uri=http://localhost:5173/callback
   &client_id=mfe-host-client
   &code_verifier=pkce_verifier  // PKCE code verifier (gerado no passo 1)

5. Keycloak responds with tokens:
   {
     "access_token": "...",
     "id_token": "...",
     "refresh_token": "...",
     "expires_in": 300,
     "refresh_expires_in": 1800
   }
```

**Requisitos de Autenticacao:**
- Implementar Authorization Code Flow com PKCE
- Silent refresh usando refresh_token (1 minuto antes da expiracao)
- Token storage em memoria (variaveis JavaScript)
- Logout com redirect para Keycloak end_session_endpoint

### 2. Module Federation Runtime Integration

**Host App (vite.config.ts):**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/enhanced/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host_app',
      // NENHUM remote declarado estaticamente
      remotes: {},
      shared: {
        react: { singleton: true, eager: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, eager: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
      },
    }),
  ],
  server: {
    port: 5173,
    headers: {
      'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://keycloak.local http://localhost:3000; style-src 'self' 'unsafe-inline';`,
    },
  },
});
```

**Remote App (vite.config.ts - example for admin-remote):**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/enhanced/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'admin_app',
      filename: 'remoteEntry.js',
      exposes: {
        './AdminApp': './src/App.tsx',
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, eager: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
      },
    }),
  ],
  server: {
    port: 5174,
    headers: {
      'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' http://localhost:3000; style-src 'self' 'unsafe-inline';`,
    },
  },
});
```

**Dynamic Loader Implementation:**
```typescript
// host/src/loaders/DynamicRemoteLoader.tsx
import { useEffect, useState, ComponentType } from 'react';
import { init, loadRemote } from '@module-federation/enhanced/runtime';
import type { RemoteLoaderProps, RemoteAppProps } from '../../shared/types/remote.types';
import type { AuthContext } from '../../shared/types/auth.types';

export function DynamicRemoteLoader({
  remoteName,
  moduleName,
  authContext,
  fallback: Fallback = DefaultLoader,
  errorComponent: ErrorComponent = DefaultError,
}: RemoteLoaderProps & { authContext: AuthContext }) {
  const [Component, setComponent] = useState<ComponentType<RemoteAppProps> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let retryTimer: NodeJS.Timeout;

    async function loadRemoteWithRetry(
      attempt: number = 1,
      maxAttempts: number = 3,
      delays: number[] = [1000, 2000, 4000]
    ): Promise<void> {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize Module Federation Runtime (idempotent)
        await init({
          name: 'host_app',
          remotes: [
            {
              name: remoteName,
              entry: getRemoteEntryUrl(remoteName),
            },
          ],
        });

        // Load the remote module
        const module = await loadRemote(`${remoteName}/${moduleName}`);
        const component = module.default || module;

        setComponent(() => component);
        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        if (attempt < maxAttempts) {
          // Retry with exponential backoff
          retryTimer = setTimeout(() => {
            loadRemoteWithRetry(attempt + 1, maxAttempts, delays);
          }, delays[attempt - 1]);
        } else {
          setError(`Failed to load remote after ${maxAttempts} attempts: ${errorMessage}`);
          setIsLoading(false);
        }
      }
    }

    loadRemoteWithRetry();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [remoteName, moduleName]);

  if (isLoading) return <Fallback />;
  if (error) return <ErrorComponent error={error} remoteName={remoteName} />;
  if (!Component) return <ErrorComponent error="No component loaded" remoteName={remoteName} />;

  // Pass authContext as prop to remote
  return <Component authContext={authContext} basename={getRoutePath(remoteName)} />;
}

function getRemoteEntryUrl(remoteName: string): string {
  const remoteUrls: Record<string, string> = {
    admin_app: 'http://localhost:5174/remoteEntry.js',
    sales_app: 'http://localhost:5175/remoteEntry.js',
    user_app: 'http://localhost:5176/remoteEntry.js',
  };
  return remoteUrls[remoteName] || '';
}

function getRoutePath(remoteName: string): string {
  const paths: Record<string, string> = {
    admin_app: '/admin',
    sales_app: '/sales',
    user_app: '/user',
  };
  return paths[remoteName] || '/';
}
```

### 3. Auth Context Sharing via Props + Event Bus

**Event Bus Implementation:**
```typescript
// host/src/utils/EventBus.ts
import type { AuthEvent, AuthEventHandler, AuthEventType } from '../../shared/types/auth.types';

class AuthEventBus {
  private listeners: Map<AuthEventType, Set<AuthEventHandler>> = new Map();

  on(eventType: AuthEventType, handler: AuthEventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  emit(event: AuthEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const authEventBus = new AuthEventBus();
```

**Auth Context Provider:**
```typescript
// host/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { authEventBus } from '../utils/EventBus';
import type { AuthContext, UserProfile, AuthTokens, AuthEvent } from '../../shared/types/auth.types';

const AuthContextProvider = createContext<AuthContext | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom in-memory store para tokens (mais seguro que sessionStorage)
  // Tokens são perdidos ao fazer F5, mas silent refresh os restaura automaticamente
  const inMemoryStore: Record<string, string> = {};
  const inMemoryStateStore = {
    set: (key: string, value: string) => { inMemoryStore[key] = value; return Promise.resolve(); },
    get: (key: string) => Promise.resolve(inMemoryStore[key]),
    remove: (key: string) => { delete inMemoryStore[key]; return Promise.resolve(); },
    getAllKeys: () => Promise.resolve(Object.keys(inMemoryStore)),
  };

  // Initialize OIDC User Manager
  const userManager = new UserManager({
    authority: import.meta.env.VITE_KEYCLOAK_URL,
    client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    redirect_uri: window.location.origin + '/callback',
    silent_redirect_uri: window.location.origin + '/silent-refresh',
    post_logout_redirect_uri: window.location.origin + '/',
    response_type: 'code',
    scope: 'openid profile email',
    automaticSilentRenew: true,
    loadUserInfo: true,
    stateStore: inMemoryStateStore, // Memory-only storage (RF-1.2)
    userStore: inMemoryStateStore,  // Tokens em memória apenas
  });

  const getAccessToken = useCallback(async (): Promise<string> => {
    if (!tokens) {
      throw new Error('No tokens available');
    }
    // Check if token is about to expire (within 1 minute)
    if (Date.now() >= tokens.expires_at - 60000) {
      await refreshTokens();
    }
    return tokens.access_token;
  }, [tokens]);

  const getIdToken = useCallback((): string | null => {
    return tokens?.id_token ?? null;
  }, [tokens]);

  const login = useCallback(async () => {
    await userManager.signinRedirect();
  }, [userManager]);

  const logout = useCallback(async () => {
    await userManager.signoutRedirect();
    setTokens(null);
    setUser(null);
    authEventBus.emit({ type: 'logout', timestamp: Date.now() });
  }, [userManager]);

  const refreshTokens = useCallback(async () => {
    try {
      const refreshedUser = await userManager.signinSilent();
      const newTokens: AuthTokens = {
        id_token: refreshedUser.id_token,
        access_token: refreshedUser.access_token,
        refresh_token: refreshedUser.refresh_token || '',
        expires_at: Date.now() + (refreshedUser.expires_in || 300) * 1000,
      };
      setTokens(newTokens);

      // Extract user info from id_token
      const profile = extractUserProfile(refreshedUser.profile);
      setUser(profile);

      authEventBus.emit({ type: 'token_refreshed', timestamp: Date.now(), data: profile });
    } catch (err) {
      setError('Token refresh failed');
      authEventBus.emit({ type: 'error', timestamp: Date.now(), data: err });
      throw err;
    }
  }, [userManager]);

  const onAuthEvent = useCallback((handler: (event: AuthEvent) => void) => {
    const events: AuthEventType[] = ['login', 'logout', 'token_refreshed', 'access_denied', 'error'];
    const unsubscribers = events.map(eventType =>
      authEventBus.on(eventType, handler)
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Handle callback from Keycloak
  useEffect(() => {
    async function handleCallback() {
      try {
        const user = await userManager.signinCallback();
        if (user) {
          const authTokens: AuthTokens = {
            id_token: user.id_token,
            access_token: user.access_token,
            refresh_token: user.refresh_token || '',
            expires_at: Date.now() + (user.expires_in || 300) * 1000,
          };
          setTokens(authTokens);
          setUser(extractUserProfile(user.profile));
          authEventBus.emit({ type: 'login', timestamp: Date.now(), data: extractUserProfile(user.profile) });
        }
      } catch (err) {
        setError('Authentication failed');
        authEventBus.emit({ type: 'access_denied', timestamp: Date.now(), data: err });
      } finally {
        setIsLoading(false);
      }
    }

    if (window.location.pathname === '/callback') {
      handleCallback();
    }
  }, [userManager]);

  // Silent refresh setup
  useEffect(() => {
    const timer = setInterval(() => {
      if (tokens && Date.now() >= tokens.expires_at - 60000) {
        refreshTokens().catch(() => {
          // Silent refresh failed, user may need to re-login
          logout();
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(timer);
  }, [tokens, refreshTokens, logout]);

  const value: AuthContext = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    getAccessToken,
    getIdToken,
    login,
    logout,
    refreshTokens,
    onAuthEvent,
    emitAuthEvent: (event: AuthEvent) => authEventBus.emit(event),
  };

  return (
    <AuthContextProvider.Provider value={value}>
      {children}
    </AuthContextProvider.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContextProvider);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

function extractUserProfile(profile: any): UserProfile {
  const roles = profile.realm_access?.roles || [];
  return {
    sub: profile.sub,
    name: profile.name,
    email: profile.email,
    preferred_username: profile.preferred_username,
    roles: roles,
  };
}
```

### 4. Backend JWT Validation with JWKS

**JWT Service Implementation:**
```typescript
// backend/src/services/jwt.service.ts
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import type { IJwtService, JwtValidationResult, KeycloakJwtPayload, Role } from '../types';

export class JwtService implements IJwtService {
  private client: jwksClient.JwksClient;
  private issuer: string;
  private audience: string;

  constructor() {
    this.issuer = process.env.KEYCLOAK_ISSUER || 'https://keycloak.local/realms/mfe-poc';
    this.audience = process.env.KEYCLOAK_AUDIENCE || 'mfe-host-client';

    this.client = jwksClient({
      jwksUri: `${this.issuer}/protocol/openid-connect/certs`,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  async validateToken(token: string): Promise<JwtValidationResult> {
    try {
      // Get signing key
      const key = await this.client.getSigningKeyAsync();
      const signingKey = key.getPublicKey();

      // Verify token
      const decoded = jwt.verify(token, signingKey, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['RS256'],
      }) as KeycloakJwtPayload;

      return {
        valid: true,
        payload: decoded,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'EXPIRED_TOKEN' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        if (error.message.includes('invalid signature')) {
          return { valid: false, error: 'INVALID_SIGNATURE' };
        }
        if (error.message.includes('issuer')) {
          return { valid: false, error: 'INVALID_ISSUER' };
        }
        if (error.message.includes('audience')) {
          return { valid: false, error: 'INVALID_AUDIENCE' };
        }
      }
      return { valid: false, error: 'MALFORMED_TOKEN' };
    }
  }

  extractRoles(payload: KeycloakJwtPayload): Role[] {
    // Extract from realm_access (realm-level roles)
    const realmRoles = payload.realm_access?.roles || [];
    return realmRoles.filter((role): role is Role =>
      ['ADMIN', 'SALES', 'USER'].includes(role)
    );
  }

  extractUserInfo(payload: KeycloakJwtPayload) {
    return {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      preferred_username: payload.preferred_username,
    };
  }
}
```

### 5. Keycloak Automated Setup Script

**Script em Node.js para configurar Keycloak:**
```typescript
// infrastructure/keycloak/setup-script.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const ADMIN_USERNAME = process.env.KEYCLOAK_ADMIN || 'admin';
const ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const REALM_NAME = 'mfe-poc';
const CLIENT_ID = 'mfe-host-client';
// Nota: Public Client com PKCE não requer client_secret (mais seguro para SPAs)

let adminToken;

async function main() {
  console.log('🚀 Starting Keycloak setup...');

  try {
    // Step 1: Get admin token
    console.log('📝 Getting admin token...');
    adminToken = await getAdminToken();

    // Step 2: Create realm
    console.log('🌐 Creating realm...');
    await createRealm();

    // Step 3: Create client
    console.log('🔑 Creating OIDC client...');
    await createClient();

    // Step 4: Create roles
    console.log('👥 Creating roles...');
    await createRoles();

    // Step 5: Create users
    console.log('👤 Creating users...');
    await createUsers();

    console.log('✅ Keycloak setup completed successfully!');
    console.log('');
    console.log('📋 Test Credentials:');
    console.log('   Admin:  admin / admin123');
    console.log('   Sales:  sales / sales123');
    console.log('   User:   user / user123');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

async function getAdminToken() {
  const response = await axios.post(
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return response.data.access_token;
}

async function createRealm() {
  await axios.post(
    `${KEYCLOAK_URL}/admin/realms`,
    {
      realm: REALM_NAME,
      enabled: true,
      displayName: 'MFE RBAC POC',
      sslRequired: 'external',
      loginTheme: 'keycloak',
    },
    { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
  );
}

async function createClient() {
  await axios.post(
    `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients`,
    {
      clientId: CLIENT_ID,
      enabled: true,
      // Public Client com PKCE (sem secret) - seguro para SPAs
      publicClient: true,
      redirectUris: ['http://localhost:5173/*', 'https://host.mfe.local/*'],
      webOrigins: ['http://localhost:5173', 'https://host.mfe.local'],
      standardFlowEnabled: true,
      directAccessGrantsEnabled: false, // Desabilitar para SPAs
      serviceAccountsEnabled: false,
      validRedirectUris: ['http://localhost:5173/*', 'https://host.mfe.local/*'],
      protocol: 'openid-connect',
      attributes: {
        'access.token.lifespan': '300',
        'pkce.code.challenge.method': 'S256', // Habilitar PKCE
      },
    },
    { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
  );
}

async function createRoles() {
  const roles = ['ADMIN', 'SALES', 'USER'];

  for (const roleName of roles) {
    await axios.post(
      `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles`,
      { name: roleName },
      { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
    );
  }
}

async function createUsers() {
  const users = [
    { username: 'admin', password: 'admin123', roles: ['ADMIN'], firstName: 'Ana', lastName: 'Admin', email: 'ana@corp.com' },
    { username: 'sales', password: 'sales123', roles: ['SALES'], firstName: 'Carlos', lastName: 'Sales', email: 'carlos@corp.com' },
    { username: 'user', password: 'user123', roles: ['USER'], firstName: 'João', lastName: 'User', email: 'joao@corp.com' },
  ];

  for (const user of users) {
    // Create user
    const createUserResponse = await axios.post(
      `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users`,
      {
        username: user.username,
        enabled: true,
        emailVerified: true,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        credentials: [{ type: 'password', value: user.password, temporary: false }],
      },
      { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
    );

    const userId = createUserResponse.headers.location.split('/').pop();

    // Get role IDs
    for (const roleName of user.roles) {
      const rolesResponse = await axios.get(
        `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/${roleName}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      const roleRepresentation = [{ id: rolesResponse.data.id, name: roleName }];

      // Assign role to user
      await axios.post(
        `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${userId}/role-mappings/realm`,
        roleRepresentation,
        { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
      );
    }
  }
}

main();
```

**Package.json script:**
```json
{
  "scripts": {
    "setup:keycloak": "node infrastructure/keycloak/setup-script.js"
  }
}
```

---

## Analise de Impacto

### Componentes Afetados

| Componente Afetado | Tipo de Impacto | Descricao & Nivel de Risco | Acao Requerida |
|-------------------|-----------------|----------------------------|----------------|
| **host/** | Novo Componente | Aplicacao Host nova - Medio risco | Implementar do zero |
| **admin-remote/** | Novo Componente | Remote Admin novo - Medio risco | Implementar do zero |
| **sales-remote/** | Novo Componente | Remote Sales novo - Medio risco | Implementar do zero |
| **user-remote/** | Novo Componente | Remote User novo - Medio risco | Implementar do zero |
| **backend/** | Novo Componente | Backend API novo - Medio risco | Implementar do zero |
| **infrastructure/keycloak/** | Infraestrutura | Keycloak container novo - Baixo risco | Configurar Docker |
| **shared/types/** | Novo Componente | Tipos compartilhados - Baixo risco | Criar interfaces TypeScript |

**Impactos Especificos:**

- **Frontend Apps:** Requerem configuracao de Module Federation, OIDC client, e React Router. Nao ha impactos em sistemas existentes pois sao componentes novos.

- **Backend API:** Novo servico, sem impacto em APIs existentes. Requer configuracao de CORS para permitir requests do frontend.

- **Keycloak:** Container Docker independente. Nao impacta infraestrutura existente.

- **Network:** Requer portas: 8080 (Keycloak), 3000 (Backend), 5173-5176 (Frontend dev servers).

### Dependencias

**Dependencias Diretas:**
- Keycloak deve estar rodando antes de iniciar Backend
- Backend deve estar rodando antes de iniciar Host
- Host requer Backend para manifesto
- Remotes sao independentes (podem iniciar em qualquer ordem)

**Dependencias de Bloqueio:**
- Nenhuma dependencia externa bloqueante (todos os componentes sao novos)

---

## Abordagem de Testes

### Testes Unitarios

**Backend (backend/):**

```typescript
// backend/src/__tests__/services/jwt.service.test.ts
import { JwtService } from '../../services/jwt.service';

describe('JwtService', () => {
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService();
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      const validToken = generateMockToken({ roles: ['ADMIN'] });
      const result = await jwtService.validateToken(validToken);
      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
    });

    it('should reject expired token', async () => {
      const expiredToken = generateMockToken({ exp: Date.now() / 1000 - 3600 });
      const result = await jwtService.validateToken(expiredToken);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('EXPIRED_TOKEN');
    });

    it('should reject token with invalid signature', async () => {
      const invalidToken = 'invalid.token.here';
      const result = await jwtService.validateToken(invalidToken);
      expect(result.valid).toBe(false);
    });
  });

  describe('extractRoles', () => {
    it('should extract roles from realm_access', () => {
      const payload = {
        realm_access: { roles: ['ADMIN', 'USER'] },
      };
      const roles = jwtService.extractRoles(payload);
      expect(roles).toEqual(['ADMIN', 'USER']);
    });

    it('should return empty array if no roles', () => {
      const payload = { realm_access: { roles: [] } };
      const roles = jwtService.extractRoles(payload);
      expect(roles).toEqual([]);
    });
  });
});
```

```typescript
// backend/src/__tests__/services/manifest.service.test.ts
import { ManifestService } from '../../services/manifest.service';
import { Role } from '../../types';

describe('ManifestService', () => {
  let manifestService: ManifestService;

  beforeEach(() => {
    manifestService = new ManifestService();
  });

  describe('getAuthorizedRemotes', () => {
    it('should return all remotes for ADMIN', () => {
      const remotes = manifestService.getAuthorizedRemotes(['ADMIN']);
      expect(remotes.length).toBe(3);
      expect(remotes.find(r => r.remoteName === 'admin_app')).toBeDefined();
      expect(remotes.find(r => r.remoteName === 'sales_app')).toBeDefined();
      expect(remotes.find(r => r.remoteName === 'user_app')).toBeDefined();
    });

    it('should return SALES and USER remotes for SALES role', () => {
      const remotes = manifestService.getAuthorizedRemotes(['SALES']);
      expect(remotes.length).toBe(2);
      expect(remotes.find(r => r.remoteName === 'sales_app')).toBeDefined();
      expect(remotes.find(r => r.remoteName === 'user_app')).toBeDefined();
      expect(remotes.find(r => r.remoteName === 'admin_app')).toBeUndefined();
    });

    it('should return only USER remote for USER role', () => {
      const remotes = manifestService.getAuthorizedRemotes(['USER']);
      expect(remotes.length).toBe(1);
      expect(remotes.find(r => r.remoteName === 'user_app')).toBeDefined();
    });
  });
});
```

**Frontend (host/):**

```typescript
// host/src/__tests__/contexts/AuthContext.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../contexts/AuthContext';

describe('AuthContext', () => {
  it('should provide auth context', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle login', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await act(async () => {
      await result.current.login();
    });

    // Verify redirect was triggered
  });
});
```

### Testes de Integracao

```typescript
// backend/src/__tests__/integration/config.routes.integration.test.ts
import request from 'supertest';
import { app } from '../../server';
import { generateMockToken } from '../helpers/token-generator';

describe('POST /api/config/remotes - Integration', () => {
  it('should return manifest for authenticated ADMIN user', async () => {
    const token = generateMockToken({ roles: ['ADMIN'] });

    const response = await request(app)
      .post('/api/config/remotes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.remotes).toBeDefined();
    expect(response.body.remotes.length).toBeGreaterThanOrEqual(1);
    expect(response.body.user.roles).toContain('ADMIN');
  });

  it('should return 401 for invalid token', async () => {
    await request(app)
      .post('/api/config/remotes')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('should return 403 for user without valid roles', async () => {
    const token = generateMockToken({ roles: [] });

    await request(app)
      .post('/api/config/remotes')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
```

### Checklist Manual de Testes

```markdown
## Checklist de Validacao - MFE RBAC POC

### Autenticacao
- [ ] Usuario eh redirecionado para Keycloak ao acessar a aplicacao
- [ ] Login com credenciais validas funciona
- [ ] Login com credenciais invalidas retorna erro
- [ ] Tokens sao armazenados em memoria (nao localStorage)
- [ ] Silent refresh funciona antes da expiracao
- [ ] Logout limpa tokens e redireciona para Keycloak

### RBAC e Manifest
- [ ] Manifest Service retorna apenas remotes autorizados
- [ ] Usuario ADMIN ve todos os remotes (Admin, Sales, User)
- [ ] Usuario SALES ve apenas Sales e User
- [ ] Usuario USER ve apenas User
- [ ] RemoteEntry.js de remotes nao autorizados nunca sao baixados
- [ ] Menu dinamico exibe apenas opcoes autorizadas

### Carregamento de Remotes
- [ ] Admin Remote carrega apenas para ADMIN
- [ ] Sales Remote carrega para SALES e ADMIN
- [ ] User Remote carrega para todos autenticados
- [ ] Lazy loading funciona (codigo baixado apenas ao navegar)
- [ ] Error boundary exibe mensagem em caso de falha
- [ ] Retry mechanism funciona (ate 3 tentativas)

### Segurança
- [ ] Backend valida assinatura JWT com JWKS
- [ ] Token expirado retorna 401
- [ ] Token invalido retorna 401
- [ ] Sem roles retorna 403
- [ ] Headers de seguranca configurados (CSP, X-Frame-Options, etc)
- [ ] CORS whitelist configurado corretamente

### Performance
- [ ] Time to Interactive (Host) < 3 segundos
- [ ] Remote First Paint < 2 segundos
- [ ] Manifest Response < 500ms
- [ ] Bundle size do Host < 200KB gzipped

### UX
- [ ] Menu lateral responsivo (collapse em mobile)
- [ ] Loading state exibido durante carregamento
- [ ] Mensagens de erro amigaveis
- [ ] Acessibilidade (tab, enter, escape funcionando)
- [ ] Contraste de cores adequado (WCAG AA)
```

---

## Sequenciamento de Desenvolvimento

### Ordem de Construção

**Fase 1: Infraestrutura (1-2 dias)**
1. Criar estrutura de diretorios (host/, backend/, admin-remote/, sales-remote/, user-remote/, infrastructure/, shared/)
2. Configurar Docker Compose (Keycloak, network)
3. Criar Keycloak setup script
4. Executar setup e testar criacao de realm/users

**Fase 2: Backend API (2-3 dias)**
1. Configurar projeto Node.js/TypeScript
2. Implementar JWT Service (validacao com JWKS)
3. Implementar Manifest Service (filtragem RBAC)
4. Criar endpoints POST /api/config/remotes e GET /health
5. Configurar CORS e security headers
6. Testes unitarios e integracao

**Fase 3: Host App (3-4 dias)**
1. Configurar projeto React + Vite
2. Implementar OIDC Client (oidc-client-ts)
3. Implementar Auth Context e Event Bus
4. Implementar Dynamic Remote Loader
5. Implementar Menu Dinamico e React Router
6. Integrar com Manifest Service
7. Testes de autenticacao e carregamento

**Fase 4: Remotes (4-5 dias)**
1. Admin Remote
   - Configurar Module Federation
   - Implementar Role Guard
   - Criar Dashboard e Users List
2. Sales Remote
   - Configurar Module Federation
   - Implementar Role Guard
   - Criar Dashboard e Sales Charts
3. User Remote
   - Configurar Module Federation
   - Criar Profile e Edit Profile pages

**Fase 5: Integracao e Testes (2-3 dias)**
1. Testes end-to-end do fluxo completo
2. Validacao de seguranca (todos os criterios)
3. Testes de performance
4. Correcao de bugs
5. Documentacao final

### Dependencias Tecnicas

| Componente | Dependencias | Bloqueios |
|------------|--------------|-----------|
| **Infraestrutura** | Docker, Node.js | Nenhum |
| **Backend API** | Keycloak rodando | Infraestrutura |
| **Host App** | Backend API rodando, Keycloak configurado | Backend |
| **Remotes** | Host configurado, Backend API | Host |

**Caminho Critico:** Infraestrutura → Backend → Host → Remotes

---

## Monitoramento e Observabilidade

### Métricas a Expor

**Backend API:**
```typescript
// Metrics endpoints (Prometheus format)
GET /metrics

# Métricas
manifest_request_total{status="success|error"} 123
manifest_request_duration_seconds{quantile="0.5"} 0.123
manifest_request_duration_seconds{quantile="0.95"} 0.456
jwt_validation_total{result="valid|invalid"} 456
jwt_validation_duration_seconds{quantile="0.5"} 0.045
```

**Host App:**
```typescript
// Client-side metrics (para analytics/monitoring)
remote_load_total{remote_name="admin_app",status="success"} 1
remote_load_duration_seconds{remote_name="admin_app"} 1.234
auth_event_total{event_type="login|logout|token_refreshed"} 10
navigation_total{from="/",to="/admin"} 5
```

### Logging Strategy

**Backend (Winston ou Pino):**
```typescript
// backend/src/utils/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    }));
  },
  error: (message: string, error?: Error) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error: error?.stack,
    }));
  },
};
```

**Log Levels:**
- `info`: Login/logout successful, manifest requests
- `warn`: Token refresh retry, remote load retry
- `error`: Failed authentication, failed remote load

**Exemplos de Logs:**
```json
// Info - Manifest request
{
  "level": "info",
  "message": "manifest_request",
  "timestamp": "2026-01-27T12:00:00Z",
  "userId": "user-123",
  "roles": ["ADMIN"],
  "remotesCount": 3,
  "duration_ms": 123
}

// Error - Remote load failed
{
  "level": "error",
  "message": "remote_load_failed",
  "timestamp": "2026-01-27T12:00:00Z",
  "remoteName": "admin_app",
  "error": "Network timeout",
  "attempt": 3
}
```

---

## Consideracoes Tecnicas

### Decisoes Principais

| Decisao | Justificativa | Trade-offs | Alternativas Rejeitadas |
|---------|---------------|------------|------------------------|
| **Module Federation Runtime API** | Permite carregamento dinamico baseado em RBAC | Complexidade maior, requires reliable manifest service | Remotes estaticos (seguranca inadequada), Iframes (overhead alto) |
| **Memory-only Token Storage** | Mais seguro que localStorage (imune a XSS) | Perdido ao refresh F5, requer silent refresh | localStorage (vulneravel a XSS), HttpOnly cookies (requer backend proxy) |
| **JWKS com RS256** | Nao compartilha segredo, padrao OIDC | Requer chamada de rede inicial | HS256 (compartilha segredo), Introspection endpoint (latencia alta) |
| **Props Drilling + Event Bus** | Baixo acoplamento, tipagem clara | Props drilling pode ser verboso | Context API isolado (pode nao funcionar), localStorage (nao reativo) |
| **Docker Compose para todos** | Reprodutibilidade, one-command setup | Docker overhead | Setup manual (Works on my machine), Kubernetes (overkill para POC) |

### Riscos Conhecidos

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Module Federation version conflicts | Baixa | Alto | Lock de versoes exatas (Vite 5.x, @module-federation/enhanced fixed version) |
| CORS issues em dev | Media | Medio | Configurar CORS corretamente, usar /api proxy em Vite |
| Keycloak setup complexo | Media | Medio | Script automatizado, Docker Compose pre-configurado |
| Token refresh race conditions | Baixa | Alto | Implementar mutex para refresh, usar oidc-client-ts built-in |
| Remote load failures | Media | Medio | Retry com exponential backoff, error boundaries, fallback UI |
| JWKS endpoint unavailable | Baixa | Medio | Cache agressivo (10min), fallback para cached keys |

### Requisitos Especiais

**Performance:**
- Time to Interactive (Host) < 3 segundos
- Remote First Paint < 2 segundos
- Manifest Response < 500ms
- Bundle size Host < 200KB gzipped
- Silent refresh < 1 segundo

**Seguranca:**
- Tokens armazenados em memoria (nao localStorage/sessionStorage)
- CSP com 'unsafe-eval' (trade-off para Module Federation)
- JWT validado com JWKS (RS256)
- Headers de seguranca em todas as responses
- CORS whitelist configurado
- Cada remote valida suas proprias roles (defense in depth)

**Compatibilidade:**
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- iOS Safari 14+, Chrome Android 90+
- Responsivo: desktop (1024px+), tablet (768px+), mobile (320px+)

### Conformidade com Padrões

**ADRs Aplicados:**
- ADR-001: Module Federation com Runtime API Dinâmico
- ADR-002: Token Storage em Memória com Silent Refresh
- ADR-003: Compartilhamento de Auth Context via Props + Event Bus
- ADR-004: Validação de JWT com JWKS (No Secret Sharing)
- ADR-005: Estrutura de Monorepo com Diretórios Separados
- ADR-006: React Router v6 com Rotas Dinâmicas
- ADR-007: Docker Compose para Orquestração Local

**Padroes de Projeto:**
- SOLID principles (separacao de responsabilidades)
- DRY (shared types para evitar duplicacao)
- Dependency Inversion (interfaces para services)
- Single Source of Truth (Manifest Service central)

---

## Docker Compose Configuration

### docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: mfe-keycloak
    environment:
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN:-admin}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:-admin}
      KC_DB: dev-file
      KC_HEALTH_ENABLED: "true"
      KC_METRICS_ENABLED: "true"
    ports:
      - "8080:8080"
    command: start-dev
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health/ready"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - keycloak_data:/opt/keycloak/data
    networks:
      - mfe-network

  backend-api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mfe-backend-api
    environment:
      NODE_ENV: development
      PORT: 3000
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_ISSUER: http://localhost:8080/realms/mfe-poc
      KEYCLOAK_AUDIENCE: mfe-host-client
      # Apenas o Host faz requests ao backend (remotes não precisam de CORS)
      CORS_ORIGINS: http://localhost:5173
    ports:
      - "3000:3000"
    depends_on:
      keycloak:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - mfe-network

  # Frontend apps devem rodar fora do Docker em desenvolvimento
  # para habilitar hot reload. Em producao, use nginx containers.

volumes:
  keycloak_data:

networks:
  mfe-network:
    driver: bridge
```

### .env.example

```bash
# .env.example

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_URL=http://localhost:8080

# Backend
BACKEND_PORT=3000
BACKEND_URL=http://localhost:3000

# Frontend
HOST_PORT=5173
ADMIN_REMOTE_PORT=5174
SALES_REMOTE_PORT=5175
USER_REMOTE_PORT=5176

# OIDC
VITE_KEYCLOAK_URL=http://localhost:8080/realms/mfe-poc
VITE_KEYCLOAK_CLIENT_ID=mfe-host-client
```

---

## Arquivos de Configuracao Detalhados

### Backend: backend/package.json

```json
{
  "name": "mfe-backend-api",
  "version": "1.0.0",
  "description": "Backend API for MFE RBAC POC",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "jwks-rsa": "^3.1.0",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0"
  }
}
```

### Backend: backend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node", "jest"],
    "baseUrl": "../../",
    "paths": {
      "@shared/types/*": ["shared/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Backend: backend/src/server.ts

```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { configRoutes } from './routes/config.routes';
import { healthRoutes } from './routes/health.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://keycloak.local'],
    },
  },
}));

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));

// Body parser
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Routes
app.use('/api/config', configRoutes);
app.use('/health', healthRoutes);

// Error handling
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export { app };
```

### Host: host/package.json

```json
{
  "name": "mfe-host",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@module-federation/enhanced": "^0.6.0",
    "oidc-client-ts": "^2.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "typescript": "^5.3.3"
  }
}
```

### Host: host/vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/enhanced/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host_app',
      remotes: {}, // Dynamic loading only
      shared: {
        react: { singleton: true, eager: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, eager: true, requiredVersion: '^18.2.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.21.0' },
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' http://localhost:8080 http://localhost:3000; style-src 'self' 'unsafe-inline';",
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@shared': '/../../shared',
    },
  },
});
```

### Remote Example: admin-remote/vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/enhanced/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'admin_app',
      filename: 'remoteEntry.js',
      exposes: {
        './AdminApp': './src/App.tsx',
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, eager: true, requiredVersion: '^18.2.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.21.0' },
      },
    }),
  ],
  server: {
    port: 5174,
    strictPort: true,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' http://localhost:3000; style-src 'self' 'unsafe-inline';",
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
  },
});
```

---

## Guia de Execucao Rápida

### Setup Inicial

```bash
# 1. Clone o repositorio
git clone <repo-url>
cd mfe-dinamico

# 2. Copie arquivo de ambiente
cp .env.example .env

# 3. Inicie a infraestrutura (Keycloak + Backend)
docker-compose up keycloak backend-api

# 4. Aguarde Keycloak estar pronto (approx 30 segundos)
docker logs -f mfe-keycloak

# 5. Execute o script de setup do Keycloak
npm run setup:keycloak

# 6. Instale as dependencias
npm install
cd host && npm install
cd ../admin-remote && npm install
cd ../sales-remote && npm install
cd ../user-remote && npm install
cd ../backend && npm install

# 7. Inicie os aplicativos (em terminais separados)
# Terminal 2: Host
cd host && npm run dev

# Terminal 3: Admin Remote
cd admin-remote && npm run dev

# Terminal 4: Sales Remote
cd sales-remote && npm run dev

# Terminal 5: User Remote
cd user-remote && npm run dev
```

### Acesso

- **Host App:** http://localhost:5173
- **Keycloak Admin Console:** http://localhost:8080 (admin/admin)
- **Backend API:** http://localhost:3000

### Credenciais de Teste

| Role | Username | Password |
|------|----------|----------|
| ADMIN | admin | admin123 |
| SALES | sales | sales123 |
| USER | user | user123 |

---

## Anexo: Tabela de Interfaces Completas

### Resumo de Todas as Interfaces

| Arquivo | Interface | Propósito |
|---------|-----------|-----------|
| `shared/types/auth.types.ts` | `AuthContext` | Contexto de autenticacao compartilhado |
| `shared/types/auth.types.ts` | `UserProfile` | Perfil do usuario |
| `shared/types/auth.types.ts` | `AuthTokens` | Tokens JWT |
| `shared/types/auth.types.ts` | `AuthEvent` | Eventos do Event Bus |
| `shared/types/manifest.types.ts` | `ManifestResponse` | Resposta do Manifest Service |
| `shared/types/manifest.types.ts` | `RemoteConfig` | Configuracao de um remote |
| `shared/types/remote.types.ts` | `RemoteLoaderProps` | Props do Dynamic Remote Loader |
| `shared/types/remote.types.ts` | `RemoteAppProps` | Props que remotes recebem |
| `backend/src/types/index.ts` | `KeycloakJwtPayload` | Payload do JWT Keycloak |
| `backend/src/types/index.ts` | `AuthenticatedRequest` | Request Express autenticada |
| `backend/src/services/jwt.service.ts` | `IJwtService` | Interface do JWT Service |
| `backend/src/services/manifest.service.ts` | `IManifestService` | Interface do Manifest Service |

---

**Status da Tech Spec:** Pronto para implementacao
**Proxima Revisao:** Apos implementacao completa da POC
**Aprovacoes Pendentes:** Tech Lead, Security

---

**Historico de Mudanças:**

| Versao | Data | Autor | Descricao |
|--------|------|-------|-----------|
| 1.0 | 27/01/2026 | Tassio Gomes | Versao inicial completa da Tech Spec |
| 1.1 | 27/01/2026 | Tassio Gomes | Correções: unificação plugin @module-federation/enhanced, PKCE com Public Client, memory-only token storage, sintaxe CSP, documentação requiredRoles vazio, CORS whitelist |
