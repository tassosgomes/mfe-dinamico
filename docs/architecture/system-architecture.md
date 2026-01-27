# Arquitetura do Sistema - MFE RBAC POC

**Data:** 27 de Janeiro de 2026
**Versão:** 1.0
**Autor:** Tassio Gomes

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Browser (Client)                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                       Host Application                           │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │   │
│  │  │   OIDC      │  │   Dynamic    │  │    React Router v6    │  │   │
│  │  │   Client    │  │   Loader     │  │     (Rotas Dinâmicas) │  │   │
│  │  │             │  │              │  │                        │  │   │
│  │  │ - Login     │  │ - loadRemote │  │ - /admin/*  (Admin)   │  │   │
│  │  │ - Logout    │  │ - init()     │  │ - /sales/*  (Sales)   │  │   │
│  │  │ - Refresh   │  │ - retry      │  │ - /user/*   (User)    │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                 │                                        │
│              ┌──────────────────┼──────────────────┐                    │
│              │                  │                  │                    │
│              ▼                  ▼                  ▼                    │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               │
│  │  Admin Remote │  │  Sales Remote │  │  User Remote  │               │
│  │   (ADMIN)     │  │ (SALES/ADMIN) │  │  (All Users)  │               │
│  │               │  │               │  │               │               │
│  │ - Users CRUD  │  │ - Dashboard   │  │ - Profile     │               │
│  │ - Settings    │  │ - Reports     │  │ - Edit Info   │               │
│  │ - Token Val.  │  │ - Token Val.  │  │ - Token Val.  │               │
│  └───────────────┘  └───────────────┘  └───────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS (OIDC)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Infrastructure Layer                            │
│                                                                          │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐    │
│  │    Keycloak Server      │    │     Backend API (Node.js)        │    │
│  │   (Docker Container)    │    │     (Docker Container)           │    │
│  │                         │    │                                 │    │
│  │ - OIDC Provider         │    │ - POST /api/config/remotes      │    │
│  │ - JWT RS256             │    │ - JWT Validation (JWKS)         │    │
│  │ - Realm: mfe-poc        │    │ - RBAC Filtering                │    │
│  │ - Roles: ADMIN/SALES/USER│   │ - CORS Configuration            │    │
│  │ - User Management       │    │ - Health Check                  │    │
│  └─────────────────────────┘    └─────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Autenticação e Autorização

### Sequence Diagram

```
User          Host App          Keycloak          Backend API        Remote
 │                │                  │                  │               │
 ├─(1) Access────>│                  │                  │               │
 │                │                  │                  │               │
 │                ├─(2) Redirect─────>│                  │               │
 │                │                  │                  │               │
 │                │<─(3) Auth Code────┤                  │               │
 │                │                  │                  │               │
 │                ├─(4) Exchange Code for Tokens────────>│               │
 │                │                  │                  │               │
 │                │<─(5) JWT Tokens (id/access/refresh)──┤               │
 │                │                  │                  │               │
 │                ├─(6) POST /api/config/remotes (access_token)─────────>│
 │                │                  │                  │               │
 │                │                  │                  ├─(7) Validate──>│
 │                │                  │                  │   JWT         │
 │                │                  │                  │<──────────────┤
 │                │                  │                  │               │
 │                │<─(8) Manifest JSON (Authorized Remotes)─────────────┤
 │                │                  │                  │               │
 │                ├─(9) Initialize Module Federation─────────────────────>│
 │                │    with authorized remotes      │               │
 │                │                  │                  │               │
 │                ├─(10) Render Dynamic Menu         │               │
 │                │    with authorized options       │               │
 │                │                  │                  │               │
 │<─(11) Ready─────┤                  │                  │               │
 │                │                  │                  │               │
 │                │                  │                  │               │
 ├─(12) Click Menu>│                  │                  │               │
 │                │                  │                  │               │
 │                ├─(13) React Router Navigation     │               │
 │                │                  │                  │               │
 │                │                  │                  │               │
 │                ├─(14) loadRemote(remoteName)─────────────────────────>│
 │                │    (Lazy Load)    │                  │               │
 │                │                  │                  │               │
 │                │<─(15) Remote Module Rendered─────────────────────────┤
 │                │                  │                  │               │
 │<─(16) Dashboard─┤                  │                  │               │
```

---

## Componentes em Detalhe

### 1. Host Application

**Responsabilidades:**
- Autenticação OIDC com Keycloak
- Gerenciamento de tokens (access, refresh)
- Menu de navegação dinâmico
- Orquestração de Module Federation
- Error boundaries globais
- Logout seguro

**Stack:**
- React 18+ com Vite
- React Router v6
- @module-federation/enhanced (Runtime API)
- oidc-client-ts ou react-oidc-context
- Context API (AuthContext)

**Fluxo Interno:**
```
1. App Init
   ├─> Check session (localStorage/memory)
   │   ├─> Valid session → Restore tokens
   │   └─> No session → Redirect to Keycloak
   │
2. OIDC Callback
   ├─> Exchange code for tokens
   ├─> Extract roles from JWT
   └─> Store tokens securely
   │
3. Fetch Manifest
   ├─> POST /api/config/remotes
   ├─> Send Authorization: Bearer {access_token}
   └─> Receive authorized remotes list
   │
4. Initialize Module Federation
   ├─> init({ name: 'host', remotes: [...] })
   └─> Register dynamic routes
   │
5. Render App
   ├─> Header (User info + Logout)
   ├─> Sidebar (Dynamic menu)
   └─> Content Area (Router Outlet)
```

### 2. Backend API (Manifest Service)

**Responsabilidades:**
- Validar tokens JWT (assinatura, expiração, issuer)
- Extrair roles/claims do token
- Filtrar remotes baseado em roles
- Retornar manifesto de configuração
- Health checks

**Stack:**
- Node.js 18+ com TypeScript
- Express.js
- jsonwebtoken + jwks-rsa
- cors
- helmet (security headers)

**Endpoints:**

```typescript
// POST /api/config/remotes
// Request:
// Headers: Authorization: Bearer {access_token}
// Body: (opcional) { clientInfo: {...} }
//
// Response 200:
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
    },
    // ... outros remotes
  ],
  "user": {
    "sub": "user-id",
    "name": "John Doe",
    "email": "john@corp.com",
    "roles": ["ADMIN"]
  }
}
//
// Response 401: Invalid or expired token
// Response 403: User has no valid roles

// GET /health
// Response 200: { status: "ok", timestamp: "..." }
```

**Lógica de Filtragem:**
```typescript
function filterRemotesByUserRoles(userRoles: string[]): Remote[] {
  const allRemotes = getAllRemotesConfig();

  return allRemotes.filter(remote => {
    // Se remote.requiredRoles está vazio, todos acessam
    if (!remote.requiredRoles || remote.requiredRoles.length === 0) {
      return true;
    }

    // Verifica se usuário tem pelo menos uma role required
    return remote.requiredRoles.some(role => userRoles.includes(role));
  });
}
```

### 3. Keycloak

**Configuração:**
- Docker container oficial
- Realm: `mfe-poc`
- Client: `mfe-host-client`
- Client Protocol: `openid-connect`
- Access Type: `confidential`
- Standard Flow Enabled: `true`
- Valid Redirect URIs: `http://localhost:5173/*`

**Roles:**
- `ADMIN` - Administrador do sistema
- `SALES` - Gerente comercial
- `USER` - Usuário comum (default)

**Users (Teste):**
| Username | Password | Roles |
|----------|----------|-------|
| admin | admin123 | ADMIN |
| sales | sales123 | SALES |
| user | user123 | USER |

### 4. Admin Remote

**Responsabilidades:**
- Dashboard administrativo
- Gerenciamento de usuários
- Configurações do sistema
- Validação própria de token/roles

**Stack:**
- React 18+ com Vite
- @module-federation/enhanced
- React Router v6 (basename: `/admin`)
- Component Library (Material UI ou similar)

**Module Federation Config:**
```javascript
// vite.config.ts
export default defineConfig({
  plugins: [
    federation({
      name: 'admin_app',
      filename: 'remoteEntry.js',
      exposes: {
        './AdminApp': './src/App',
      },
      shared: {
        react: { singleton: true, eager: true },
        'react-dom': { singleton: true, eager: true },
        'react-router-dom': { singleton: true }
      }
    })
  ]
});
```

**Validação de Segurança:**
```typescript
// AdminApp.tsx
export const AdminApp = () => {
  const { user } = useAuthContext();

  useEffect(() => {
    // Validação própria (defesa em profundidade)
    if (!user?.roles?.includes('ADMIN')) {
      // Redirect ou Access Denied
      window.location.href = '/access-denied';
    }
  }, [user]);

  // ... rest do componente
};
```

### 5. Sales Remote

**Similar ao Admin, mas:**
- Role: SALES ou ADMIN
- Exposed: `./SalesApp`
- Route: `/sales/*`
- Dashboard com gráficos de vendas

### 6. User Remote

**Similar ao Admin, mas:**
- Role: Todos autenticados
- Exposed: `./UserApp`
- Route: `/user/*`
- Perfil do usuário

---

## Segurança em Profundidade (Defense in Depth)

### Camada 1: Network
- **RemoteEntry.js não autorizados nunca são solicitados**
- Host filtra no manifesto antes de registrar remotes
- Se remote não está no manifesto, loadRemote() nunca é chamado

### Camada 2: Backend
- **Validação completa de JWT**
- Assinatura verificada com Keycloak public key (JWKS)
- exp, nbf, iss, aud validados
- Roles extraídas e validadas

### Camada 3: Host
- **Tokens armazenados em memória**
- Silent refresh com refresh_token
- Logout limpa todos os tokens
- Manifest caching (5min TTL)

### Camada 4: Remotes
- **Cada remote valida suas próprias roles**
- Decodifica JWT (sem verificar assinatura para performance)
- Renderiza "Access Denied" se inválido
- Não confia apenas no Host

### Headers de Segurança
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' https://keycloak.local https://api.mfe.local
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
```

---

## Escalabilidade e Performance

### Lazy Loading Strategy
```
Host App Load
    ├─> Core Bundle (React, Router, OIDC) ~ 150KB
    ├─> Initial Manifest Fetch
    └─> Menu Rendered

User Navigation to /admin
    ├─> Trigger: loadRemote('admin_app')
    ├─> Fetch: https://admin.mfe.local/remoteEntry.js
    ├─> Fetch: Chunks necessários
    └─> Render AdminApp

User Navigation to /sales
    ├─> Trigger: loadRemote('sales_app')
    ├─> Fetch: https://sales.mfe.local/remoteEntry.js
    ├─> Fetch: Chunks necessários
    └─> Render SalesApp

Benefício: Admin chunks NÃO são baixados para usuário SALES
```

### Cache Strategy
- **Manifest:** 5 minutos (memory) + revalidation em background
- **RemoteEntry.js:** Cache por versão (1 ano com ?v=X.Y.Z)
- **Chunks:** Cache com ETag / Last-Modified
- **Tokens:** Memory com refresh automático

---

## Monitoramento e Observabilidade

### Métricas a Coletar
1. **Performance:**
   - Time to First Byte (Host)
   - Remote Load Time
   - Manifest Response Time

2. **Segurança:**
   - Tentativas de acesso negado (401/403)
   - Tokens expirados
   - Remote load failures

3. **UX:**
   - Menu render time
   - Navegação entre remotes
   - Error Boundary triggers

### Logging Strategy
```typescript
// Backend
logger.info('manifest_request', {
  userId: jwtPayload.sub,
  roles: jwtPayload.roles,
  remotesCount: remotes.length,
  timestamp: Date.now()
});

// Host
logger.info('remote_load', {
  remoteName: 'admin_app',
  loadTime: 1234,
  success: true,
  timestamp: Date.now()
});
```

---

## Próximos Passos

1. ✅ PRD Completo
2. ✅ Arquitetura Definida
3. ⏳ **Setup do Ambiente de Desenvolvimento**
4. ⏳ Implementação do Backend (Manifest Service)
5. ⏳ Implementação do Host App
6. ⏳ Implementação dos Remotes
7. ⏳ Configuração do Keycloak
8. ⏳ Testes End-to-End
9. ⏳ Documentação de Setup

---

**Status:** Em desenvolvimento
**Próxima Atividade:** Setup do ambiente (Docker Compose + Estrutura de monorepo)
