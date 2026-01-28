# Architecture Decision Records (ADR) - MFE RBAC POC

**Data:** 27 de Janeiro de 2026
**Versão:** 1.0
**Autor:** Tassio Gomes

---

## Sobre ADR

Architecture Decision Records (ADRs) documentam decisões arquiteturais significativas em um projeto de software. Cada ADR captura:
- **Contexto:** O que motivou a decisão
- **Decisão:** O que foi decidido
- **Consequências:** Impactos positivos e negativos
- **Alternativas:** Opções consideradas

**Status:**
- ✅ **Proposed** - Proposta para discussão
- ✅ **Accepted** - Decisão aceita e implementada
- ❌ **Deprecated** - Decisão substituída
- ⚠️ **Superseded** - Decisão substituída por nova

---

## ADR-001: Module Federation com Runtime API Dinâmico

**Status:** ✅ Accepted
**Data:** 27/01/2026
**Decidido por:** Tassio Gomes

### Contexto

Precisamos implementar uma arquitetura de micro-frontends onde o carregamento de módulos remotos é condicionado às permissões do usuário (RBAC). A abordagem estática tradicional do Module Federation (declarar remotes no `webpack.config.js` ou `vite.config.js`) não atende porque:
1. Todos os remotes são conhecidos no build-time
2. Todos os remoteEntry.js são incluídos no HTML inicial
3. Não é possível filtrar remotes baseado em permissões do usuário em tempo de execução
4. Alterações na lista de remotes exigem rebuild do Host

### Decisão

**Adotar Module Federation Runtime API (`@module-federation/enhanced`) com carregamento 100% dinâmico.**

O Host App:
- NÃO declara remotes no arquivo de configuração (`remotes: {}`)
- Usa `init()` e `loadRemote()` do runtime em tempo de execução
- Registra remotes após receber manifesto do backend
- Carrega remotes sob demanda (lazy loading)

Exemplo:
```typescript
// Após receber manifesto do backend
import { init, loadRemote } from '@module-federation/enhanced/runtime';

await init({
  name: 'host_app',
  remotes: authorizedRemotes.map(r => ({
    name: r.remoteName,
    entry: r.remoteEntry
  }))
});

// Lazy loading de remote
const AdminApp = await loadRemote('admin_app/AdminApp');
```

### Consequências

**Positivos:**
- ✅ Permite carregar remotes baseado em permissões do usuário
- ✅ RemoteEntry.js de módulos não autorizados nunca são solicitados
- ✅ Pode adicionar/remover remotes sem rebuild do Host
- ✅ Manifesto pode ser versionado e atualizado independentemente
- ✅ Melhor performance (carrega apenas o necessário)

**Negativos:**
- ⚠️ Complexidade maior (runtime initialization vs build-time config)
- ⚠️ Requires manifest service confiável (single point of failure)
- ⚠️ TypeScript requires tipagem dinâmica para módulos carregados
- ⚠️ Debugging pode ser mais difícil

**Mitigações:**
- Implementar robust error boundaries e retry mechanism
- Caching de manifesto com fallback para configuração estática
- Type safety com Zod ou similar para validar manifesto

### Alternativas Consideradas

**Alternativa 1: Promise-Based Remotes (Webpack 5)**
- ❌ Requer lógica injetada como string no config
- ❌ Difícil de manter e testar
- ❌ Não suporta validação de tipos em tempo de compilação

**Alternativa 2: Configuração Estática com Roteamento Condicional**
- ❌ Todos os remotes são baixados mesmo que não autorizados
- ❌ Segurança inadequada (código expeto no client-side)
- ✅ Simples de implementar

**Alternativa 3: Micro-frontends com Iframes**
- ❌ Isolamento completo mas alto overhead
- ❌ Comunicação difícil entre host/remotes
- ❌ Performance pior que Module Federation

### Referências
- [Module Federation 2.0 Spec](https://module-federation.io/)
- [Rspack Enhanced Guide](https://rspack.dev/guide/enhanced/)
- estudo.md (Seção 4.2)

---

## ADR-002: Token Storage em Memória com Silent Refresh

**Status:** ✅ Accepted
**Data:** 27/01/2026
**Decidido por:** Tassio Gomes

### Contexto

Precisamos armazenar tokens JWT (id_token, access_token, refresh_token) no client-side após autenticação OIDC. Existem múltiplas opções, cada uma com trade-offs de segurança vs usabilidade.

Opções consideradas:
1. **localStorage** - Simples, mas vulnerável a XSS
2. **sessionStorage** - Limpo ao fechar browser, ainda vulnerável a XSS
3. **Memory** - Mais seguro, perdido ao refresh F5
4. **HttpOnly Cookies** - Mais seguro, requer backend para tokens

### Decisão

**Adotar Memory Storage com Silent Refresh automático.**

Tokens são armazenados em variáveis JavaScript (memory) com:
- Silent refresh em background usando `refresh_token`
- Refresh automático 1 minuto antes da expiração
- Session restoration via prompt de login (se refresh falhar)

```typescript
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  async startAutoRefresh() {
    setInterval(async () => {
      const expiresSoon = Date.now() >= (this.tokenExpiry - 60000); // 1min antes
      if (expiresSoon && this.refreshToken) {
        await this.refreshTokens();
      }
    }, 30000); // Checa a cada 30s
  }

  async refreshTokens() {
    const response = await fetch('https://keycloak.local/token', {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      })
    });
    // ... update tokens in memory
  }
}
```

### Consequências

**Positivos:**
- ✅ Mais seguro que localStorage (imune a XSS)
- ✅ Tokens perdidos ao fechar aba (mais seguro)
- ✅ Silent refresh mantém sessão ativa
- ✅ Padrão recomendado para apps sensíveis

**Negativos:**
- ⚠️ Tokens perdidos ao refresh F5 (requer re-login)
- ⚠️ Complexidade de implementar silent refresh
- ⚠️ Requer gerenciamento de race conditions

**Mitigações:**
- Implementar session restoration automático
- Usar session storage para "session hint" (não tokens completos)
- Prompt de login não intrusivo

### Alternativas Consideradas

**Alternativa 1: localStorage**
- ❌ Vulnerável a XSS attacks
- ❌ Tokens persistem indefinidamente
- ✅ Simples de implementar
- ✅ Sessão mantida após refresh F5

**Alternativa 2: HttpOnly Cookies**
- ✅ Mais seguro (imune a XSS)
- ❌ Requer backend proxy para Keycloak
- ❌ Complexidade arquitetural adicional
- ❌ Tokens não acessíveis no client-side para API calls

**Alternativa 3: sessionStorage**
- ❌ Ainda vulnerável a XSS
- ✅ Limpo ao fechar aba
- ⚠️ Medium security (mas não production-grade)

### Referências
- [OAuth 2.0 for Browser-Based Apps (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749)
- [OIDC Best Practices](https://openid.net/specs/openid-connect-core-1_0.html)
- PRD Q4: Estratégia de Token Storage

---

## ADR-003: Compartilhamento de Auth Context via Props + Event Bus

**Status:** ✅ Accepted
**Data:** 27/01/2026
**Decidido por:** Tassio Gomes

### Contexto

Remotes precisam acessar informações de autenticação (tokens, user profile, roles) para:
1. Validar permissões próprias (defense in depth)
2. Fazer chamadas API com Authorization header
3. Exibir informações do usuário
4. Implementar logout

Precisamos passar essas informações do Host para os Remotes, mantendo baixo acoplamento.

### Decisão

**Adotar abordagem híbrida: Props Drilling + Event Bus customizado.**

**Props Drilling:**
- Host passa informações essenciais via props
- Informações: user object, getAccessToken() function, logout() function
- Tipo de dados: Read-only, imutáveis

**Event Bus:**
- EventEmitter customizado para eventos de auth
- Eventos: 'login', 'logout', 'token_refreshed', 'access_denied'
- Remotes se inscrevem para receber atualizações

```typescript
// Host passa props para DynamicRemoteLoader
<DynamicRemoteLoader
  remoteName="admin_app"
  moduleName="./AdminApp"
  authContext={{
    user: currentUser,
    getAccessToken: () => tokenManager.getAccessToken(),
    logout: () => handleLogout(),
    onAuthEvent: (event) => console.log('Auth event:', event)
  }}
/>

// Remote consome
export const AdminApp = ({ authContext }: { authContext: AuthContext }) => {
  const { user, getAccessToken } = authContext;

  useEffect(() => {
    // Subscribe to auth events
    const unsubscribe = authContext.onAuthEvent((event) => {
      if (event.type === 'token_refreshed') {
        // Update API interceptors
      }
    });
    return unsubscribe;
  }, [authContext]);

  // Validate roles
  if (!user.roles.includes('ADMIN')) {
    return <AccessDenied />;
  }

  // ... rest do componente
};
```

### Consequências

**Positivos:**
- ✅ Baixo acoplamento (remotes não dependem de Context específico)
- ✅ Flexível (fácil adicionar novos remotes)
- ✅ Tipagem clara com TypeScript
- ✅ Event-driven (reativo a mudanças de auth)
- ✅ Testável (é fácil mockar authContext)

**Negativos:**
- ⚠️ Props drilling pode ser verboso
- ⚠️ Event Bus requer gerenciamento de subscriptions
- ⚠️ Requer padronização de authContext interface

**Mitigações:**
- Criar tipo TypeScript compartilhado (`@types/auth-context`)
- Documentar interface claramente
- Auto-unsubscribe em useEffect cleanup

### Alternativas Consideradas

**Alternativa 1: Module Federation Shared Context**
- ❌ Requer configuração de shared modules
- ❌ Acoplamento alto (remotes dependem de context do Host)
- ❌ Versioning de shared context complexo
- ✅ Automático (não precisa props)

**Alternativa 2: Context API Exclusivamente**
- ⚠️ Acoplamento alto (remotes importam context do Host)
- ⚠️ Pode não funcionar com Module Federation (context isolation)
- ✅ Padrão React familiar
- ✅ Reativo por natureza

**Alternativa 3: localStorage/sessionStorage**
- ❌ Vulnerável a XSS
- ❌ Remotes precisam saber onde buscar
- ❌ Não reativo
- ✅ Simples de implementar

**Alternativa 4: API Backend (/api/auth/me)**
- ✅ Remotes buscam user info independentemente
- ❌ Necessita additional API calls
- ❌ Tokens ainda precisam ser passados
- ⚠️ Latência adicional

### Referências
- [React Context API](https://react.dev/reference/react/useContext)
- [EventEmitter Pattern](https://nodejs.dev/learn/the-nodejs-event-emitter)
- PRD Q5: Compartilhamento de Contexto de Auth

---

## ADR-004: Validação de JWT com JWKS (No Secret Sharing)

**Status:** ✅ Accepted
**Data:** 27/01/2026
**Decidido por:** Tassio Gomes

### Contexto

O Backend precisa validar tokens JWT emitidos pelo Keycloak. A validação requer:
1. Verificar assinatura do token
2. Validar expiração (exp), issuer (iss), audience (aud)
3. Extrair roles/claims

Para verificar assinatura, precisamos da **public key** do Keycloak. Existem duas abordagens:

**Opção A: Client Secret (Shared Secret)**
- Backend e Keycloak compartilham um segredo
- Tokens são assinados com HS256 (HMAC)
- Backend valida com mesmo segredo

**Opção B: JWKS (JSON Web Key Set)**
- Keycloak expõe public keys via endpoint
- Tokens são assinados com RS256 (RSA)
- Backend busca public key dinamicamente

### Decisão

**Adotar JWKS com RS256 (assimetrada).**

Backend usa biblioteca `jwks-rsa` para:
1. Buscar public keys de `https://keycloak.local/realms/mfe-poc/protocol/openid-connect/certs`
2. Cache de keys (com TTL)
3. Validar token sem compartilhar segredo

```typescript
import jwt from 'jsonwebtoken';
import { JwtVerifier } from 'jwks-rsa';

const verifier = new JwtVerifier({
  issuer: 'https://keycloak.local/realms/mfe-poc',
  jwksUri: 'https://keycloak.local/realms/mfe-poc/protocol/openid-connect/certs',
  cache: true,
  cacheMaxAge: 600000 // 10 minutos
});

async function validateToken(token: string) {
  try {
    const decoded = await verifier.verifyAccessToken(token);
    return decoded;
  } catch (err) {
    throw new Error('Invalid token');
  }
}
```

### Consequências

**Positivos:**
- ✅ Mais seguro (não compartilha segredo)
- ✅ Padrão OIDC (todos os IdPs suportam JWKS)
- ✅ Escalável (múltiplos backends podem validar)
- ✅ Cache de keys reduz latência
- ✅ Key rotation automática

**Negativos:**
- ⚠️ Requer chamada de rede inicial (JWKS fetch)
- ⚠️ Slight overhead de validação (RSA vs HMAC)
- ⚠️ Depende de disponibilidade do endpoint JWKS

**Mitigações:**
- Cache agressivo de keys (10+ minutos)
- Fallback para keys em cache se JWKS unavailable
- Background refresh de keys

### Alternativas Consideradas

**Alternativa 1: Client Secret (HS256)**
- ❌ Requer compartilhamento de segredo (risco de exposição)
- ❌ Menos seguro (simétrico)
- ❌ Key rotation difícil
- ✅ Simples de implementar
- ✅ Não requer chamada de rede

**Alternativa 2: Introspection Endpoint (Keycloak)**
- Backend chama endpoint do Keycloak para validar token
- ❌ Requisição adicional para cada validação
- ❌ Alta latência
- ❌ Dependência de Keycloak disponibilidade
- ✅ Validação em tempo real

**Alternativa 3: Sem Validação (Trust Only)**
- Backend confia no token sem validar
- ❌ Não é seguro (qualquer um pode forjar token)
- ❌ Não é production-grade
- ✅ Zero latência

### Referências
- [JWKS RFC 7517](https://datatracker.ietf.org/doc/html/rfc7517)
- [jwks-rsa Library](https://github.com/auth0/node-jwks-rsa)
- [Keycloak JWKS Endpoint](https://www.keycloak.org/docs/latest/securing_apps/#_token-validation)

---

## ADR-005: Estrutura de Monorepo com Diretórios Separados

**Status:** ✅ Accepted
**Data:** 27/01/2026
**Decidido por:** Tassio Gomes

### Contexto

Precisamos organizar o código-fonte da POC com:
1. Host App (1 aplicação)
2. 3 Remote Apps (Admin, Sales, User)
3. Backend API (1 serviço)
4. Configuração Docker (Keycloak, compose)

Existem múltiplas estruturas de monorepo possíveis, cada uma com trade-offs de organização vs complexidade.

### Decisão

**Adotar estrutura de diretórios separados (flat structure).**

```
mfe-dinamico/
├── apps/
│   ├── host/              # Host Application
│   ├── admin-remote/      # Admin Remote
│   ├── sales-remote/      # Sales Remote
│   └── user-remote/       # User Remote
├── services/
│   └── backend-api/       # Node.js Backend
├── infrastructure/
│   ├── keycloak/          # Keycloak config & realm
│   └── docker/            # Docker Compose
├── docs/                  # Documentação (PRD, ADR, Architecture)
├── shared/                # Shared types/utilities (opcional)
└── package.json           # Root package.json
```

**Características:**
- Cada app em seu próprio diretório
- package.json independente (ou workspaces)
- Docker Compose orquestra tudo
- Compartilhamento via `shared/` (types, utilitários)

### Consequências

**Positivos:**
- ✅ Separação clara de responsabilidades
- ✅ Fácil adicionar/remover apps
- ✅ Cada app pode ter versões diferentes de deps
- ✅ Deploy independente possível no futuro
- ✅ Docker Compose fácil de configurar

**Negativos:**
- ⚠️ Duplicação de dependências (node_modules em cada app)
- ⚠️ Configuração de TypeScript repetida
- ⚠️ Sem compartilhamento automático de code

**Mitigações:**
- NPM workspaces para shared dependencies
- Configuração base em `shared/tsconfig.base.json`
- Docker layer caching para builds rápidos

### Alternativas Consideradas

**Alternativa 1: Monorepo com Nx/Turborepo**
- ✅ Compartilhamento de code eficiente
- ✅ Build caching inteligente
- ✅ Monorepo tooling completo
- ❌ Complexidade alta
- ❌ Overhead para POC pequena

**Alternativa 2: Apps em sub-diretórios (host/remotes/)**
- ✅ Agrupamento lógico
- ❌ Hierarquia profunda
- ❌ Confuso visualmente

**Alternativa 3: Repositórios Separados (Multi-repo)**
- ✅ Total independência
- ❌ Dificuldade de sync
- � não faz sentido para POC

**Alternativa 4: Tudo em um único diretório**
- ❌ Bagunçado
- ❌ Difícil de navegar
- ✅ Simples (mas demais)

### Referências
- [Monorepo Patterns](https://monorepo.tools/)
- [NPM Workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces)
- PRD Q1: Estrutura de Diretórios do Monorepo

---

## ADR-006: React Router v6 com Rotas Dinâmicas

**Status:** ✅ Accepted
**Data:** 27/01/2026
**Decidido por:** Tassio Gomes

### Contexto

O Host precisa gerar rotas dinamicamente baseado no manifesto de remotes. Quando o Host recebe a lista de remotes autorizados, ele deve:

1. Registrar rota para cada remote (ex: `/admin/*`, `/sales/*`)
2. Renderizar componente remoto na rota
3. Passar props (authContext, etc)

React Router v6 favorece rotas estáticas, mas suporta geração dinâmica.

### Decisão

**Adotar React Router v6 com geração dinâmica de rotas + useRoutes hook.**

```typescript
// Host App
import { useRoutes } from 'react-router-dom';

function App() {
  const { manifest } = useManifestContext();

  const routes = useRoutes([
    {
      path: '/',
      element: <Layout />
      children: [
        { index: true, element: <Home /> },
        // Rotas dinâmicas geradas do manifesto
        ...manifest.remotes.map(remote => ({
          path: `${remote.routePath}/*`,
          element: (
            <DynamicRemoteLoader
              remoteName={remote.remoteName}
              moduleName={remote.exposedModule}
              authContext={authContext}
            />
          )
        })),
        { path: '*', element: <NotFound /> }
      ]
    }
  ]);

  return routes;
}
```

**Importante:** Remotes usam `basename` para rotas relativas
```typescript
// Admin Remote (executado sob /admin/*)
const AdminApp = () => {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="users" element={<UsersList />} />
    </Routes>
  );
};

// No Host
<BrowserRouter basename="/admin">
  <AdminApp />
</BrowserRouter>
```

### Consequências

**Positivos:**
- ✅ Totalmente dinâmico (manifesto drive)
- ✅ Type safety com TypeScript
- ✅ Padrão React Router oficial
- ✅ Lazy loading automático

**Negativos:**
- ⚠️ Remotes precisam saber seu `basename`
- ⚠️ Complexidade para aninhamento de rotas
- ⚠️ Requer setup correto de BrowserRouter

**Mitigações:**
- Padronizar convention: `basename` = `routePath` do manifesto
- Documentar padrão claramente
- Usar `MemoryRouter` em remotes se isolamento total necessário

### Alternativas Consideradas

**Alternativa 1: Rotas Estáticas no Host**
- ❌ Remotes hardcodados no Host
- ❌ Não atende requisito de dinamismo
- ✅ Simples

**Alternativa 2: Roteamento Manual (sem Router library)**
- ❌ Requer implementação própria
- ❌ Mais propenso a bugs
- ❌ Não aproveita ecossistema React

**Alternativa 3: Single Page com Múltiplos Routers**
- ⚠️ Remotes teriam seu próprio BrowserRouter
- ⚠️ Pode causar conflitos de histórico
- ✅ Isolamento completo

### Referências
- [React Router v6 Docs](https://reactrouter.com/)
- [Dynamic Routes Pattern](https://reactrouter.com/docs/en/v6/getting-started/overview#dynamic-routes)
- estudo.md (Seção 7.1)

---

## ADR-007: Docker Compose para Orquestração Local

**Status:** ✅ Accepted
**Data:** 27/01/2026
**Decidido por:** Tassio Gomes

### Contexto

Ambiente de desenvolvimento local requer:
1. Keycloak (Identity Provider)
2. Backend API (Manifest Service)
3. Host App (Vite dev server)
4. 3 Remote Apps (Vite dev servers)
5. Rede local para comunicação

Total de **5 serviços** rodando simultaneamente. Orquestrar manualmente é propenso a erros e difícil de reproduzir.

### Decisão

**Adotar Docker Compose para todos os serviços.**

Arquitetura:
- **Todos os serviços em containers** (exceto apps frontend em dev)
- **Apps frontend:** Modo híbrido
  - Dev: Vite dev server fora do container (hot reload)
  - Prod: Nginx containers servindo builds estáticos
- **Keycloak:** Oficial image
- **Backend API:** Node.js container

```yaml
# docker-compose.yml
version: '3.8'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    ports:
      - "8080:8080"
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    command: start-dev

  backend-api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      KEYCLOAK_URL: http://keycloak:8080
    depends_on:
      - keycloak

  # Frontend apps em desenvolvimento: rodar fora do Docker
  # host, admin-remote, sales-remote, user-remote: npm run dev

volumes:
  keycloak_data:
```

Para desenvolvimento:
```bash
# Terminal 1: Start infra
docker-compose up keycloak backend-api

# Terminal 2: Host
cd host && npm run dev

# Terminal 3: Admin Remote
cd admin-remote && npm run dev

# ... etc
```

### Consequências

**Positivos:**
- ✅ Reprodutibilidade garantida
- ✅ One-command setup (`docker-compose up`)
- ✅ Isolamento de dependências
- ✅ Simula ambiente de produção
- ✅ Fácil de compartilhar com time

**Negativos:**
- ⚠️ Modo híbrido (frontends fora, backends dentro) confuso inicialmente
- ⚠️ Docker overhead (CPU/Memory)
- ⚠️ Hot reload em containers requer volume mounts

**Mitigações:**
- Documentar claramente setup de desenvolvimento
- Scripts de helper (`npm run dev:all`)
- Usar Vite's HMR no modo host (não container)

### Alternativas Consideradas

**Alternativa 1: Tudo em Containers**
- ❌ Hot reload lento ou complexo
- ❌ Rebuild de imagem a cada change
- ✅ Mais consistente com prod

**Alternativa 2: Nada em Docker (manual)**
- ❌ Setup manual propenso a erros
- ❌ Difícil de reproduzir
- ❌ "Works on my machine"
- ✅ Hot reload nativo

**Alternativa 3: Kubernetes (Kind/Minikube)**
- ❌ Overkill para POC
- ❌ Complexidade alta
- ✅ Simulação realista de prod
- ✅ Padrão cloud-native

### Referências
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Keycloak Docker Image](https://hub.docker.com/r/quay.io/keycloak/keycloak)
- PRD Q2: Estratégia de Deploy Local

---

## Índice de ADRs

| ADR | Título | Status | Data |
|-----|--------|--------|------|
| ADR-001 | Module Federation com Runtime API Dinâmico | ✅ Accepted | 27/01/2026 |
| ADR-002 | Token Storage em Memória com Silent Refresh | ✅ Accepted | 27/01/2026 |
| ADR-003 | Compartilhamento de Auth Context via Props + Event Bus | ✅ Accepted | 27/01/2026 |
| ADR-004 | Validação de JWT com JWKS (No Secret Sharing) | ✅ Accepted | 27/01/2026 |
| ADR-005 | Estrutura de Monorepo com Diretórios Separados | ✅ Accepted | 27/01/2026 |
| ADR-006 | React Router v6 com Rotas Dinâmicas | ✅ Accepted | 27/01/2026 |
| ADR-007 | Docker Compose para Orquestração Local | ✅ Accepted | 27/01/2026 |

---

**Status do Documento:** Em desenvolvimento
**Próxima Revisão:** Pós-POC (para validar decisões)
