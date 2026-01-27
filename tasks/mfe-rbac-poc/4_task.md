---
status: pending
parallelizable: false
blocked_by: ["1.0", "2.0"]
---

<task_context>
<domain>apps/host</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>react, vite, oidc-client-ts, react-router-dom</dependencies>
<unblocks>"5.0"</unblocks>
</task_context>

# Tarefa 4.0: Host Application - Autenticação OIDC

## Visão Geral

Implementar a autenticação OIDC no Host Application usando oidc-client-ts. Esta tarefa cobre o fluxo completo de autenticação com Keycloak, incluindo login, logout, refresh de tokens e o AuthContext que será compartilhado com os remotes.

## Requisitos

<requirements>
- RF-1.1: Host deve integrar com Keycloak via OIDC
- RF-1.2: Host deve armazenar tokens em memória (memory-only) para maior segurança
- RF-1.3: Host deve implementar refresh automático de tokens antes da expiração
- RF-1.9: Host deve implementar logout com redirect para Keycloak
- RF-1.10: Host deve prover contexto de autenticação para remotes via Context API + Event Bus
- RF-7.1: App deve configurar Keycloak client (client-id, realm)
- RF-7.2: App deve implementar Authorization Code Flow com PKCE
- RF-7.3: App deve trocar code por tokens (id_token, access_token, refresh_token)
- RF-7.4: App deve armazenar tokens em memória (memory-only)
- RF-7.5: App deve implementar silent refresh usando refresh_token
- RF-7.6: App deve implementar logout com redirect para Keycloak
</requirements>

## Subtarefas

- [ ] 4.1 Criar estrutura de diretórios `apps/host/`
- [ ] 4.2 Inicializar projeto Vite + React + TypeScript
- [ ] 4.3 Instalar dependências: oidc-client-ts, react-router-dom
- [ ] 4.4 Configurar Vite (`vite.config.ts`) com porta 5173
- [ ] 4.5 Criar `src/auth/oidc-config.ts` com configuração do OIDC
- [ ] 4.6 Criar `src/utils/EventBus.ts` para comunicação de eventos de auth
- [ ] 4.7 Criar `src/contexts/AuthContext.tsx` com provider de autenticação
- [ ] 4.8 Implementar hook `useAuthContext()` para consumo do contexto
- [ ] 4.9 Criar `src/pages/Callback.tsx` para processar redirect do Keycloak
- [ ] 4.10 Criar `src/pages/SilentRenew.tsx` para silent refresh
- [ ] 4.11 Implementar silent refresh automático (1 minuto antes da expiração)
- [ ] 4.12 Implementar função de logout com limpeza de tokens
- [ ] 4.13 Criar `src/components/ProtectedRoute.tsx` para rotas protegidas
- [ ] 4.14 Criar `src/pages/Login.tsx` com botão de login
- [ ] 4.15 Criar `src/App.tsx` básico com rotas de auth
- [ ] 4.16 Criar `src/main.tsx` com providers
- [ ] 4.17 Testar: fluxo de login completo com Keycloak
- [ ] 4.18 Testar: logout redireciona para Keycloak
- [ ] 4.19 Testar: silent refresh renova tokens automaticamente
- [ ] 4.20 Testar: tokens são armazenados apenas em memória (não localStorage)

## Sequenciamento

- **Bloqueado por:** 1.0 (Keycloak precisa estar rodando), 2.0 (Tipos Compartilhados)
- **Desbloqueia:** 5.0 (Host Dynamic Loader precisa do AuthContext)
- **Paralelizável:** Não

## Detalhes de Implementação

### Estrutura de Diretórios
```
apps/host/
├── src/
│   ├── auth/
│   │   └── oidc-config.ts
│   ├── components/
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── Callback.tsx
│   │   ├── Login.tsx
│   │   └── SilentRenew.tsx
│   ├── utils/
│   │   └── EventBus.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── silent-renew.html
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

### OIDC Configuration (oidc-config.ts)
```typescript
import { UserManagerSettings } from 'oidc-client-ts';

export const oidcConfig: UserManagerSettings = {
  authority: 'http://localhost:8080/realms/mfe-poc',
  client_id: 'mfe-host-client',
  redirect_uri: 'http://localhost:5173/callback',
  post_logout_redirect_uri: 'http://localhost:5173',
  silent_redirect_uri: 'http://localhost:5173/silent-renew.html',
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  // Memory-only storage (não persiste em localStorage)
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
};
```

### Event Bus (EventBus.ts)
```typescript
class AuthEventBus {
  private listeners: Map<AuthEventType, Set<AuthEventHandler>> = new Map();
  
  subscribe(eventType: AuthEventType, handler: AuthEventHandler): () => void {
    // Implementar subscribe
  }
  
  emit(event: AuthEvent): void {
    // Implementar emit
  }
}

export const authEventBus = new AuthEventBus();
```

### AuthContext (AuthContext.tsx)
```typescript
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userManagerRef = useRef<UserManager | null>(null);
  
  // Inicializar UserManager
  // Configurar silent refresh
  // Extrair roles do token
  // Implementar login/logout
  
  return (
    <AuthContextProvider.Provider value={contextValue}>
      {children}
    </AuthContextProvider.Provider>
  );
}
```

### Silent Refresh
- Configurar `automaticSilentRenew: true`
- Criar `public/silent-renew.html` para iframe de renovação
- Renovar token 1 minuto antes da expiração

### Extração de Roles do Keycloak
```typescript
function extractUserProfile(oidcUser: User): UserProfile {
  const profile = oidcUser.profile;
  const roles = (profile as any).realm_access?.roles || [];
  
  return {
    sub: profile.sub!,
    name: profile.name || '',
    email: profile.email || '',
    preferred_username: profile.preferred_username || '',
    roles: roles.filter((r: string) => ['ADMIN', 'SALES', 'USER'].includes(r)),
  };
}
```

## Critérios de Sucesso

- [ ] App inicia em http://localhost:5173 sem erros
- [ ] Botão de login redireciona para Keycloak
- [ ] Callback processa code e obtém tokens
- [ ] Usuário autenticado tem dados disponíveis no AuthContext
- [ ] Roles são extraídas corretamente do token
- [ ] Silent refresh funciona automaticamente
- [ ] Logout redireciona para Keycloak e limpa sessão
- [ ] Tokens NÃO são armazenados em localStorage
- [ ] Event Bus emite eventos de auth (login, logout, token_refreshed)
- [ ] Rota protegida redireciona para login se não autenticado
