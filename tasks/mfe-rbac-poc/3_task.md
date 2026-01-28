---
status: pending
parallelizable: false
blocked_by: ["2.0"]
---

<task_context>
<domain>backend</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>express, jsonwebtoken, jwks-rsa, cors, helmet</dependencies>
<unblocks>"5.0"</unblocks>
</task_context>

# Tarefa 3.0: Backend API - Manifest Service (Node.js/Express)

## Visão Geral

Implementar o Backend API em Node.js/Express que funciona como Manifest Service. Este serviço é responsável por validar tokens JWT do Keycloak e retornar o manifesto de remotes autorizados baseado nas roles do usuário.

## Requisitos

<requirements>
- RF-2.1: Endpoint POST /api/config/remotes deve aceitar Authorization: Bearer {token}
- RF-2.2: Backend deve validar assinatura JWT com chave pública do Keycloak (JWKS)
- RF-2.3: Backend deve validar expiração (exp), issuer (iss) e audience (aud)
- RF-2.4: Backend deve extrair roles do token do Keycloak
- RF-2.5: Backend deve filtrar remotes baseado nas roles do usuário
- RF-2.6: Backend deve retornar HTTP 401 para token inválido ou expirado
- RF-2.7: Backend deve retornar HTTP 403 para usuário sem roles válidas
- RF-2.8: Backend deve implementar CORS com whitelist de origens permitidas
- RF-2.9: Backend deve implementar endpoint GET /health para health checks
- RF-2.10: Backend deve logar requests de manifesto para auditoria
</requirements>

## Subtarefas

- [ ] 3.1 Criar estrutura de diretórios `backend/`
- [ ] 3.2 Inicializar projeto Node.js com TypeScript (`package.json`, `tsconfig.json`)
- [ ] 3.3 Instalar dependências: express, cors, helmet, jsonwebtoken, jwks-rsa, dotenv
- [ ] 3.4 Criar `src/types/index.ts` com tipos específicos do backend
- [ ] 3.5 Criar `src/config/index.ts` com configurações de ambiente
- [ ] 3.6 Criar `src/config/keycloak.config.ts` com configuração do Keycloak
- [ ] 3.7 Criar `src/config/remotes.config.ts` com configuração dos remotes
- [ ] 3.8 Criar `src/services/jwt.service.ts` para validação de JWT
- [ ] 3.9 Criar `src/services/manifest.service.ts` para filtragem de remotes
- [ ] 3.10 Criar `src/middleware/auth.middleware.ts` para autenticação
- [ ] 3.11 Criar `src/middleware/cors.middleware.ts` para configuração CORS
- [ ] 3.12 Criar `src/middleware/error.middleware.ts` para tratamento de erros
- [ ] 3.13 Criar `src/routes/config.routes.ts` com endpoint POST /api/config/remotes
- [ ] 3.14 Criar `src/routes/health.routes.ts` com endpoint GET /health
- [ ] 3.15 Criar `src/utils/logger.ts` para logging de auditoria
- [ ] 3.16 Criar `src/server.ts` como entry point da aplicação
- [ ] 3.17 Criar scripts npm: `dev`, `build`, `start`
- [ ] 3.18 Testar: endpoint /health retorna 200
- [ ] 3.19 Testar: endpoint /api/config/remotes retorna 401 sem token
- [ ] 3.20 Testar: endpoint /api/config/remotes retorna manifesto com token válido

## Sequenciamento

- **Bloqueado por:** 2.0 (Tipos Compartilhados)
- **Desbloqueia:** 5.0 (Host App Dynamic Loader precisa do Manifest Service)
- **Paralelizável:** Não, depende dos tipos compartilhados

## Detalhes de Implementação

### Estrutura de Diretórios
```
backend/
├── src/
│   ├── config/
│   │   ├── index.ts
│   │   ├── keycloak.config.ts
│   │   └── remotes.config.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── cors.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── config.routes.ts
│   │   └── health.routes.ts
│   ├── services/
│   │   ├── jwt.service.ts
│   │   └── manifest.service.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── logger.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── .env.example
```

### JWT Service (jwt.service.ts)
```typescript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export class JwtService {
  private client: jwksClient.JwksClient;
  
  constructor() {
    this.client = jwksClient({
      jwksUri: `${process.env.KEYCLOAK_URL}/realms/mfe-poc/protocol/openid-connect/certs`,
      cache: true,
      cacheMaxAge: 600000, // 10 minutos
    });
  }
  
  async validateToken(token: string): Promise<JwtValidationResult> {
    // Implementar validação com JWKS
  }
  
  extractRoles(payload: KeycloakJwtPayload): Role[] {
    return payload.realm_access?.roles || [];
  }
}
```

### Manifest Service (manifest.service.ts)
```typescript
export class ManifestService {
  getAuthorizedRemotes(userRoles: Role[]): RemoteConfigEntry[] {
    return REMOTES_CONFIG.filter(remote => {
      if (!remote.enabled) return false;
      if (remote.requiredRoles.length === 0) return true; // Qualquer autenticado
      return remote.requiredRoles.some(role => userRoles.includes(role));
    });
  }
}
```

### CORS Configuration
```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
];
```

### Endpoint POST /api/config/remotes
- **Request:** Authorization: Bearer {access_token}
- **Response 200:** `{ remotes: [...], user: {...} }`
- **Response 401:** `{ error: 'invalid_token', code: 'EXPIRED_TOKEN' }`
- **Response 403:** `{ error: 'insufficient_permissions', code: 'INSUFFICIENT_PERMISSIONS' }`

## Critérios de Sucesso

- [ ] Servidor inicia sem erros em http://localhost:3001
- [ ] GET /health retorna `{ status: 'ok' }` com HTTP 200
- [ ] POST /api/config/remotes sem token retorna HTTP 401
- [ ] POST /api/config/remotes com token expirado retorna HTTP 401
- [ ] POST /api/config/remotes com token ADMIN retorna 3 remotes
- [ ] POST /api/config/remotes com token SALES retorna 2 remotes
- [ ] POST /api/config/remotes com token USER retorna 1 remote
- [ ] CORS rejeita origens não permitidas
- [ ] Logs de auditoria são gerados para cada request
- [ ] Tempo de resposta < 500ms para validação de token
