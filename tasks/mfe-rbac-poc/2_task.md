---
status: pending
parallelizable: true
blocked_by: []
---

<task_context>
<domain>shared/types</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>typescript</dependencies>
<unblocks>"3.0", "4.0", "5.0", "6.0", "7.0", "8.0"</unblocks>
</task_context>

# Tarefa 2.0: Definição de Tipos Compartilhados (TypeScript)

## Visão Geral

Criar os tipos TypeScript compartilhados entre Host, Backend e Remotes. Estes tipos garantem type-safety e consistência em toda a aplicação, sendo utilizados por todos os componentes do sistema.

## Requisitos

<requirements>
- Interfaces para AuthContext (estado de autenticação)
- Interfaces para Manifest (resposta do backend)
- Interfaces para Remote Loader (configuração de remotes)
- Tipos para eventos de autenticação (Event Bus)
- Tipos exportados e importáveis por todos os projetos
</requirements>

## Subtarefas

- [ ] 2.1 Criar estrutura de diretórios `shared/types/`
- [ ] 2.2 Criar `shared/types/auth.types.ts` com interfaces de autenticação
- [ ] 2.3 Criar `shared/types/manifest.types.ts` com interfaces do manifesto
- [ ] 2.4 Criar `shared/types/remote.types.ts` com interfaces do remote loader
- [ ] 2.5 Criar `shared/types/index.ts` para re-exportar todos os tipos
- [ ] 2.6 Criar `shared/package.json` para o pacote compartilhado
- [ ] 2.7 Atualizar `tsconfig.base.json` para incluir path alias para shared
- [ ] 2.8 Testar: importação dos tipos em um arquivo de teste

## Sequenciamento

- **Bloqueado por:** Nenhuma tarefa
- **Desbloqueia:** 3.0 (Backend), 4.0 (Host Auth), 5.0 (Host Loader), 6.0/7.0/8.0 (Remotes)
- **Paralelizável:** Sim, pode ser executada em paralelo com 1.0 (Infraestrutura)

## Detalhes de Implementação

### Estrutura de Diretórios
```
shared/
├── types/
│   ├── auth.types.ts
│   ├── manifest.types.ts
│   ├── remote.types.ts
│   └── index.ts
└── package.json
```

### auth.types.ts
```typescript
export interface UserProfile {
  sub: string;
  name: string;
  email: string;
  preferred_username: string;
  roles: Role[];
}

export type Role = 'ADMIN' | 'SALES' | 'USER';

export interface AuthTokens {
  id_token: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthContext {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  getAccessToken: () => Promise<string>;
  getIdToken: () => string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
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

### manifest.types.ts
```typescript
import { Role } from './auth.types';

export interface ManifestResponse {
  remotes: RemoteConfig[];
  user: ManifestUser;
}

export interface RemoteConfig {
  remoteName: string;
  remoteEntry: string;
  exposedModule: string;
  routePath: string;
  navigationLabel: string;
  requiredRoles: Role[];
  icon: string;
  version: string;
}

export interface ManifestUser {
  sub: string;
  name: string;
  email: string;
  preferred_username: string;
  roles: Role[];
}

export interface ManifestRequest {
  clientInfo?: {
    userAgent?: string;
    screenResolution?: string;
    locale?: string;
  };
}

export interface ManifestErrorResponse {
  error: string;
  error_description: string;
  code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'INSUFFICIENT_PERMISSIONS' | 'SERVER_ERROR';
}
```

### remote.types.ts
```typescript
import { ComponentType } from 'react';
import { AuthContext } from './auth.types';

export interface RemoteLoaderProps {
  remoteName: string;
  moduleName: string;
  routePath: string;
  fallback?: ComponentType;
  errorComponent?: ComponentType;
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

export interface RemoteAppProps {
  authContext: AuthContext;
  basename: string;
}
```

## Critérios de Sucesso

- [ ] Todos os arquivos de tipos criados sem erros de TypeScript
- [ ] Tipos são exportados corretamente via index.ts
- [ ] Path alias `@shared/types` funciona no tsconfig
- [ ] Documentação inline (JSDoc) presente em interfaces principais
- [ ] Tipos cobrem todos os cenários definidos na Tech Spec
