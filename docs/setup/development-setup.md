# Development Setup Guide - MFE RBAC POC

**Última Atualização:** 27 de Janeiro de 2026
**Versão:** 1.0
**Autor:** Tassio Gomes

---

## Pré-requisitos

Antes de começar, instale as seguintes ferramentas:

| Ferramenta | Versão Mínima | Instalação |
|------------|--------------|------------|
| **Node.js** | 18.x ou 20.x | [nodejs.org](https://nodejs.org/) |
| **npm** | 9.x ou 10.x | Incluído com Node.js |
| **Docker** | 24.x+ | [docker.com](https://www.docker.com/) |
| **Docker Compose** | 2.x+ | Incluído com Docker Desktop |
| **Git** | 2.x+ | [git-scm.com](https://git-scm.com/) |

### Verificar Instalações

```bash
node --version   # v18.x.x ou v20.x.x
npm --version    # 9.x.x ou 10.x.x
docker --version # Docker version 24.x.x
docker-compose --version # Docker Compose version v2.x.x
git --version    # git version 2.x.x
```

---

## Estrutura de Diretórios

```
mfe-dinamico/
├── apps/                          # Frontend Applications
│   ├── host/                      # Host Application (Shell)
│   │   ├── src/
│   │   │   ├── components/        # DynamicRemoteLoader, Layout, etc
│   │   │   ├── hooks/             # Custom hooks (useManifest, useAuth)
│   │   │   ├── contexts/          # AuthContext, ManifestContext
│   │   │   ├── utils/             # Token manager, OIDC helpers
│   │   │   ├── App.tsx            # Root component
│   │   │   └── main.tsx           # Entry point
│   │   ├── public/
│   │   ├── vite.config.ts         # Module Federation config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── admin-remote/              # Admin Dashboard Remote
│   │   ├── src/
│   │   │   ├── components/        # Dashboard components
│   │   │   ├── pages/             # Users, Settings pages
│   │   │   ├── App.tsx            # Exposed module
│   │   │   └── main.tsx
│   │   ├── vite.config.ts         # Module Federation config
│   │   └── package.json
│   │
│   ├── sales-remote/              # Sales Dashboard Remote
│   │   └── (similar structure)
│   │
│   └── user-remote/               # User Profile Remote
│       └── (similar structure)
│
├── services/                      # Backend Services
│   └── backend-api/               # Node.js + Express
│       ├── src/
│       │   ├── routes/            # API routes
│       │   │   ├── config.routes.ts
│       │   │   └── health.routes.ts
│       │   ├── middleware/        # Auth, CORS, error handlers
│       │   │   ├── auth.middleware.ts
│       │   │   └── error.middleware.ts
│       │   ├── services/          # Business logic
│       │   │   ├── manifest.service.ts
│       │   │   └── jwt.service.ts
│       │   ├── config/            # App configuration
│       │   │   ├── remotes.config.ts
│       │   │   └── index.ts
│       │   └── server.ts          # Express app entry
│       ├── package.json
│       └── tsconfig.json
│
├── infrastructure/                # Infra as Code
│   ├── docker/
│   │   ├── Dockerfile.backend     # Backend image
│   │   └── docker-compose.yml     # All services
│   ├── keycloak/
│   │   ├── realms/                # Realm export JSON
│   │   │   └── mfe-poc-realm.json
│   │   └── README.md              # Keycloak setup instructions
│   └── nginx/                     # Prod config (future)
│       └── default.conf
│
├── shared/                        # Shared Code (Optional)
│   ├── types/                     # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── manifest.types.ts
│   │   └── remote.types.ts
│   └── utils/                     # Shared utilities
│       └── logger.ts
│
├── docs/                          # Documentation
│   ├── prd/
│   │   └── mfe-rbac-poc-prd.md
│   ├── architecture/
│   │   ├── system-architecture.md
│   │   └── adr.md
│   └── setup/
│       └── development-setup.md   # (este arquivo)
│
├── scripts/                       # Automation Scripts
│   ├── dev.sh                     # Start all services
│   ├── setup.sh                   # Initial setup
│   └── test.sh                    # Run tests
│
├── .gitignore
├── package.json                   # Root package.json (workspaces)
└── README.md                      # Main README
```

---

## Passo 1: Criar Estrutura de Diretórios

```bash
# Clone ou navegue até o projeto
cd /home/tsgomes/github-tassosgomes/mfe-dinamico

# Criar estrutura de diretórios
mkdir -p apps/{host,admin-remote,sales-remote,user-remote}
mkdir -p services/backend-api/src/{routes,middleware,services,config}
mkdir -p infrastructure/{docker,keycloak/realms,nginx}
mkdir -p shared/{types,utils}
mkdir -p docs/{prd,architecture,setup}
mkdir -p scripts
```

---

## Passo 2: Inicializar Root Package.json (Workspaces)

Crie `/home/tsgomes/github-tassosgomes/mfe-dinamico/package.json`:

```json
{
  "name": "mfe-rbac-poc",
  "version": "1.0.0",
  "private": true,
  "description": "MFE RBAC POC - Micro-frontends com Module Federation e Keycloak",
  "workspaces": [
    "apps/*",
    "services/*",
    "shared/*"
  ],
  "scripts": {
    "install:all": "npm install",
    "dev:infra": "docker-compose -f infrastructure/docker/docker-compose.yml up keycloak backend-api",
    "dev:host": "npm run dev --workspace=apps/host",
    "dev:admin": "npm run dev --workspace=apps/admin-remote",
    "dev:sales": "npm run dev --workspace=apps/sales-remote",
    "dev:user": "npm run dev --workspace=apps/user-remote",
    "dev:all": "npm run dev:infra & npm run dev:host & npm run dev:admin & npm run dev:sales & npm run dev:user",
    "build:all": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

```bash
# Instalar dependências do root
npm install
```

---

## Passo 3: Configurar Docker Compose

Crie `/home/tsgomes/github-tassosgomes/mfe-dinamico/infrastructure/docker/docker-compose.yml`:

```yaml
version: '3.8'

services:
  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    container_name: mfe-poc-keycloak
    ports:
      - "8080:8080"
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_HEALTH_ENABLED: "true"
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak_password
    command: start-dev
    depends_on:
      - keycloak-db
    volumes:
      - ./../../keycloak/realms:/opt/keycloak/data/import
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health/ready"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - mfe-network

  keycloak-db:
    image: postgres:15-alpine
    container_name: mfe-poc-keycloak-db
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak_password
    volumes:
      - keycloak_db_data:/var/lib/postgresql/data
    networks:
      - mfe-network

  backend-api:
    build:
      context: ../../
      dockerfile: infrastructure/docker/Dockerfile.backend
    container_name: mfe-poc-backend-api
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_REALM: mfe-poc
      KEYCLOAK_CLIENT_ID: mfe-host-client
      CORS_ORIGINS: http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
    depends_on:
      keycloak:
        condition: service_healthy
    volumes:
      - ../../services/backend-api:/app
      - /app/node_modules
    networks:
      - mfe-network

volumes:
  keycloak_db_data:

networks:
  mfe-network:
    driver: bridge
```

---

## Passo 4: Configurar Dockerfile do Backend

Crie `/home/tsgomes/github-tassosgomes/mfe-dinamico/infrastructure/docker/Dockerfile.backend`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/backend-api/package*.json ./services/backend-api/

RUN npm ci --only=production

COPY services/backend-api ./services/backend-api

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/services/backend-api ./services/backend-api
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "services/backend-api/dist/server.js"]
```

---

## Passo 5: Configurar Keycloak Realm

### 5.1 Criar Realm Export

Crie `/home/tsgomes/github-tassosgomes/mfe-dinamico/infrastructure/keycloak/realms/mfe-poc-realm.json`:

```json
{
  "realm": "mfe-poc",
  "enabled": true,
  "sslRequired": "external",
  "registrationAllowed": false,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "bruteForceProtected": true,
  "clients": [
    {
      "clientId": "mfe-host-client",
      "enabled": true,
      "clientAuthenticatorType": "client-secret",
      "secret": "your-client-secret-here",
      "redirectUris": ["http://localhost:5173/*"],
      "webOrigins": ["http://localhost:5173"],
      "standardFlowEnabled": true,
      "implicitFlowEnabled": false,
      "directAccessGrantsEnabled": false,
      "publicClient": false,
      "protocol": "openid-connect",
      "attributes": {
        "access.token.lifespan": "300"
      },
      "fullScopeAllowed": false,
      "protocolMappers": [
        {
          "name": "realm_roles",
          "protocol": "openid-connect",
          "protocolMapper": "oidc-usermodel-realm-role-mapper",
          "consentRequired": false,
          "config": {
            "multivalued": "true",
            "userinfo.token.claim": "true",
            "id.token.claim": "true",
            "access.token.claim": "true",
            "claim.name": "roles",
            "jsonType.label": "String"
          }
        }
      ]
    }
  ],
  "roles": {
    "realm": [
      {
        "name": "ADMIN",
        "description": "Administrator - Full access"
      },
      {
        "name": "SALES",
        "description": "Sales Manager - Sales and User access"
      },
      {
        "name": "USER",
        "description": "Standard User - Basic access"
      }
    ]
  },
  "users": [
    {
      "username": "admin",
      "enabled": true,
      "emailVerified": true,
      "email": "admin@mfe.local",
      "firstName": "Admin",
      "lastName": "User",
      "credentials": [
        {
          "type": "password",
          "value": "admin123",
          "temporary": false
        }
      ],
      "realmRoles": ["ADMIN"],
      "clientRoles": {}
    },
    {
      "username": "sales",
      "enabled": true,
      "emailVerified": true,
      "email": "sales@mfe.local",
      "firstName": "Sales",
      "lastName": "Manager",
      "credentials": [
        {
          "type": "password",
          "value": "sales123",
          "temporary": false
        }
      ],
      "realmRoles": ["SALES"],
      "clientRoles": {}
    },
    {
      "username": "user",
      "enabled": true,
      "emailVerified": true,
      "email": "user@mfe.local",
      "firstName": "Regular",
      "lastName": "User",
      "credentials": [
        {
          "type": "password",
          "value": "user123",
          "temporary": false
        }
      ],
      "realmRoles": ["USER"],
      "clientRoles": {}
    }
  ],
  "browserSecurityHeaders": {
    "contentSecurityPolicyReportOnly": "",
    "xContentTypeOptions": "nosniff",
    "xRobotsTag": "none",
    "xFrameOptions": "SAMEORIGIN",
    "contentSecurityPolicy": "frame-src 'self'; frame-ancestors 'self'; object-src 'none';",
    "xXSSProtection": "1; mode=block",
    "strictTransportSecurity": "max-age=31536000; includeSubDomains"
  }
}
```

### 5.2 README do Keycloak

Crie `/home/tsgomes/github-tassosgomes/mfe-dinamico/infrastructure/keycloak/README.md`:

```markdown
# Keycloak Setup - MFE POC

## Realm: mfe-poc

### Users de Teste

| Username | Password | Roles | Access |
|----------|----------|-------|--------|
| admin | admin123 | ADMIN | All remotes |
| sales | sales123 | SALES | Sales + User |
| user | user123 | USER | User only |

### Client: mfe-host-client

- **Client ID:** `mfe-host-client`
- **Client Secret:** `your-client-secret-here` (gerar no Keycloak)
- **Redirect URI:** `http://localhost:5173/*`
- **Web Origin:** `http://localhost:5173`

### Importar Realm Manualmente

1. Acesse http://localhost:8080
2. Login como admin (admin/admin)
3. Selecione realm dropdown → "Create Realm"
4. "Import" → Select file `mfe-poc-realm.json`

### URLs Úteis

- Keycloak Admin: http://localhost:8080/admin
- Realm Settings: http://localhost:8080/admin/master/console/#/mfe-poc/realm-settings
- Clients: http://localhost:8080/admin/master/console/#/mfe-poc/clients
- Users: http://localhost:8080/admin/master/console/#/mfe-poc/users
```

---

## Passo 6: Inicializar Backend API

### 6.1 Package.json

Crie `/home/tsgomes/github-tassosgomes/mfe-dinamico/services/backend-api/package.json`:

```json
{
  "name": "@mfe-poc/backend-api",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "jwks-rsa": "^3.1.0",
    "dotenv": "^16.3.1",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

### 6.2 TypeScript Config

Crie `/home/tsgomes/github-tassosgomes/mfe-dinamico/services/backend-api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Passo 7: Comandos de Setup Rápido

Crie `/home/tsgomes/github-tassosgomes/mfe-dinamico/scripts/setup.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Setting up MFE RBAC POC..."

# Criar diretórios
echo "📁 Creating directory structure..."
mkdir -p apps/{host,admin-remote,sales-remote,user-remote}/{src,public}
mkdir -p services/backend-api/src/{routes,middleware,services,config}
mkdir -p shared/{types,utils}
mkdir -p infrastructure/{docker,keycloak/realms}

# Instalar dependências
echo "📦 Installing root dependencies..."
npm install

# Iniciar infraestrutura
echo "🐳 Starting Docker services..."
docker-compose -f infrastructure/docker/docker-compose.yml up -d keycloak backend-api

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Import Keycloak realm (if not auto-imported)"
echo "  2. Run: npm run dev:infra"
echo "  3. Run: npm run dev:all"
echo ""
echo "🌐 URLs:"
echo "  - Keycloak: http://localhost:8080"
echo "  - Backend API: http://localhost:3000"
echo "  - Host App: http://localhost:5173"
```

Torne executável:
```bash
chmod +x scripts/setup.sh
```

---

## Passo 8: Comandos de Desenvolvimento

Crie `/home/tsgomes/github-tassosgomes/mfe-dinamico/scripts/dev.sh`:

```bash
#!/bin/bash

# Start all services in background

echo "🚀 Starting MFE RBAC POC Development Environment..."

# Start infra (Keycloak + Backend)
echo "🐳 Starting Docker services..."
docker-compose -f infrastructure/docker/docker-compose.yml up -d keycloak backend-api

# Wait for infra to be ready
echo "⏳ Waiting for services..."
sleep 5

# Start frontend apps (in separate terminals)
echo "⚛️  Starting Host App..."
cd apps/host && npm run dev &

sleep 2

echo "⚛️  Starting Admin Remote..."
cd ../admin-remote && npm run dev &

sleep 2

echo "⚛️  Starting Sales Remote..."
cd ../sales-remote && npm run dev &

sleep 2

echo "⚛️  Starting User Remote..."
cd ../user-remote && npm run dev &

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Access URLs:"
echo "  - Host: http://localhost:5173"
echo "  - Keycloak Admin: http://localhost:8080 (admin/admin)"
echo "  - Backend API: http://localhost:3000/health"
echo ""
echo "Test users:"
echo "  - admin / admin123 (ADMIN)"
echo "  - sales / sales123 (SALES)"
echo "  - user / user123 (USER)"
```

Torne executável:
```bash
chmod +x scripts/dev.sh
```

---

## Passo 9: .gitignore

Crie `/home/tsgomes/github-tassosgomes/mfe-dinamico/.gitignore`:

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.log

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Docker
*.pid
*.seed
*.pid.lock

# Logs
logs/
*.log

# Testing
coverage/
.nyc_output/

# Misc
.cache/
.temp/
.tmp/
```

---

## Fluxo de Desenvolvimento

### 1. Setup Inicial

```bash
# Clonar/entrar no diretório
cd mfe-dinamico

# Rodar script de setup
./scripts/setup.sh
```

### 2. Importar Realm do Keycloak

1. Acesse http://localhost:8080
2. Login: admin/admin
3. Create Realm → Import → Select `infrastructure/keycloak/realms/mfe-poc-realm.json`

### 3. Desenvolvimento

```bash
# Opção 1: Usar script
./scripts/dev.sh

# Opção 2: Manual (terminal por terminal)
# Terminal 1
npm run dev:infra

# Terminal 2
npm run dev:host

# Terminal 3
npm run dev:admin

# Terminal 4
npm run dev:sales

# Terminal 5
npm run dev:user
```

### 4. Acessar Aplicações

- **Host:** http://localhost:5173
- **Admin Remote:** http://localhost:5174 (acessado via Host)
- **Sales Remote:** http://localhost:5175 (acessado via Host)
- **User Remote:** http://localhost:5176 (acessado via Host)

### 5. Testar

1. Acesse http://localhost:5173
2. Será redirecionado para Keycloak
3. Login com um dos usuários de teste
4. Verifique menu dinâmico baseado na role

---

## Troubleshooting

### Keycloak não inicia

```bash
# Ver logs
docker logs mfe-poc-keycloak

# Reiniciar
docker-compose -f infrastructure/docker/docker-compose.yml restart keycloak
```

### Backend não conecta no Keycloak

```bash
# Ver se Keycloak está healthy
curl http://localhost:8080/health/ready

# Ver logs do backend
docker logs mfe-poc-backend-api

# Verificar variáveis de ambiente
docker exec mfe-poc-backend-api env | grep KEYCLOAK
```

### Module Federation não carrega

```bash
# Verificar se remotes estão rodando
curl http://localhost:5174/remoteEntry.js  # Admin
curl http://localhost:5175/remoteEntry.js  # Sales
curl http://localhost:5176/remoteEntry.js  # User
```

### CORS errors

Verifique `CORS_ORIGINS` no docker-compose.yml e garanta que inclui a porta do Host (5173).

---

## Próximos Passos

Após o setup inicial:

1. ✅ **Backend API** - Implementar Manifest Service
2. ✅ **Host App** - Implementar OIDC + Dynamic Loader
3. ✅ **Remotes** - Implementar 3 remotes básicos
4. ✅ **Integração** - Testar fluxo completo
5. ✅ **Documentação** - Atualizar README principal

---

**Status do Guia:** Completo
**Próxima Atividade:** Implementar Backend API (Manifest Service)
