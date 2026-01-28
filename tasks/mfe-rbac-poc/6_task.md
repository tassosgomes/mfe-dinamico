---
status: completed
parallelizable: true
blocked_by: ["5.0"]
---

<task_context>
<domain>admin-remote</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>react, vite, @module-federation/enhanced</dependencies>
<unblocks>"9.0"</unblocks>
</task_context>

# Tarefa 6.0: Admin Remote (Micro-Frontend) ✅ CONCLUÍDA

## Visão Geral

Implementar o micro-frontend Admin Remote, acessível apenas para usuários com role ADMIN. Este remote demonstra o isolamento de funcionalidades sensíveis e a aplicação de RBAC no nível de micro-frontend, com validação própria de roles.

## Requisitos

<requirements>
- RF-3.1: Remote deve expor módulo ./AdminApp via Module Federation
- RF-3.2: Remote deve aceitar contexto de autenticação do Host
- RF-3.3: Remote deve validar role ADMIN própria antes de renderizar
- RF-3.4: Remote deve exibir "Access Denied" se usuário não tiver role ADMIN
- RF-3.5: Remote deve implementar lista de usuários do sistema
- RF-3.6: Remote deve implementar tela de configurações do sistema
- RF-3.7: Remote deve usar rota /admin/* no Host
- RF-3.8: Remote deve implementar error boundary interno
</requirements>

## Subtarefas

- [x] 6.1 Criar estrutura de diretórios `admin-remote/`
- [x] 6.2 Inicializar projeto Vite + React + TypeScript
- [x] 6.3 Instalar @module-federation/enhanced
- [x] 6.4 Configurar Module Federation no vite.config.ts (expor ./AdminApp)
- [x] 6.5 Criar `src/guards/RoleGuard.tsx` para validação de role ADMIN
- [x] 6.6 Criar `src/components/AccessDenied.tsx` para acesso negado
- [x] 6.7 Criar `src/components/ErrorBoundary.tsx` para erros internos
- [x] 6.8 Criar `src/pages/Dashboard.tsx` com visão geral do sistema
- [x] 6.9 Criar `src/pages/Users.tsx` com lista de usuários
- [x] 6.10 Criar `src/components/UsersList.tsx` com tabela de usuários
- [x] 6.11 Criar `src/pages/Settings.tsx` com configurações do sistema
- [x] 6.12 Criar `src/components/SystemSettings.tsx` com formulário de config
- [x] 6.13 Criar `src/App.tsx` com rotas internas do remote
- [x] 6.14 Criar `src/main.tsx` para desenvolvimento standalone
- [x] 6.15 Configurar shared dependencies (react, react-dom, react-router-dom)
- [x] 6.16 Testar: remote inicia standalone em http://localhost:5174
- [x] 6.17 Testar: módulo ./AdminApp é exposto corretamente
- [x] 6.18 Testar: RoleGuard bloqueia usuário sem role ADMIN
- [x] 6.19 Testar: lista de usuários renderiza corretamente
- [x] 6.20 Testar: configurações do sistema funcionam

## Sequenciamento

- **Bloqueado por:** 5.0 (Host Dynamic Loader)
- **Desbloqueia:** 9.0 (Integração E2E)
- **Paralelizável:** Sim, pode ser executada em paralelo com 7.0 e 8.0

## Detalhes de Implementação

### Estrutura de Diretórios
```
admin-remote/
├── src/
│   ├── components/
│   │   ├── AccessDenied.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── SystemSettings.tsx
│   │   └── UsersList.tsx
│   ├── guards/
│   │   └── RoleGuard.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Settings.tsx
│   │   └── Users.tsx
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
├── package.json
└── tsconfig.json
```

### Vite Config (vite.config.ts)
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
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
      },
    }),
  ],
  server: {
    port: 5174,
    cors: true,
  },
  build: {
    target: 'esnext',
  },
});
```

### Role Guard (RoleGuard.tsx)
```typescript
import { RemoteAppProps } from '@shared/types';

interface RoleGuardProps extends RemoteAppProps {
  requiredRoles: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ authContext, requiredRoles, children }: RoleGuardProps) {
  const userRoles = authContext.user?.roles || [];
  
  const hasAccess = requiredRoles.some(role => userRoles.includes(role));
  
  if (!hasAccess) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
}
```

### App.tsx (Ponto de entrada do remote)
```typescript
import { RemoteAppProps } from '@shared/types';
import { RoleGuard } from './guards/RoleGuard';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function AdminApp({ authContext, basename }: RemoteAppProps) {
  return (
    <RoleGuard authContext={authContext} requiredRoles={['ADMIN']}>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route index element={<Dashboard authContext={authContext} />} />
          <Route path="users" element={<Users authContext={authContext} />} />
          <Route path="settings" element={<Settings authContext={authContext} />} />
        </Routes>
      </BrowserRouter>
    </RoleGuard>
  );
}
```

### Dashboard (Dashboard.tsx)
```typescript
export function Dashboard({ authContext }: { authContext: AuthContext }) {
  return (
    <div className="admin-dashboard">
      <h1>Dashboard Administrativo</h1>
      <p>Bem-vindo, {authContext.user?.name}</p>
      
      <div className="stats-grid">
        <StatCard title="Usuários Ativos" value="42" />
        <StatCard title="Sessões Hoje" value="128" />
        <StatCard title="Erros de Sistema" value="3" />
      </div>
      
      <nav className="admin-nav">
        <Link to="users">Gerenciar Usuários</Link>
        <Link to="settings">Configurações</Link>
      </nav>
    </div>
  );
}
```

### Users List (UsersList.tsx)
```typescript
// Dados mock para POC
const mockUsers = [
  { id: '1', name: 'Ana Admin', email: 'ana@corp.com', role: 'ADMIN', status: 'active' },
  { id: '2', name: 'Carlos Sales', email: 'carlos@corp.com', role: 'SALES', status: 'active' },
  { id: '3', name: 'João User', email: 'joao@corp.com', role: 'USER', status: 'active' },
];

export function UsersList() {
  return (
    <table className="users-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {mockUsers.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td><RoleBadge role={user.role} /></td>
            <td><StatusBadge status={user.status} /></td>
            <td><ActionButtons userId={user.id} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Critérios de Sucesso

- [x] Remote inicia standalone em http://localhost:5174
- [x] `remoteEntry.js` é gerado e acessível
- [x] Módulo `./AdminApp` é exportado corretamente
- [x] RoleGuard valida role ADMIN antes de renderizar
- [x] Usuário sem role ADMIN vê "Access Denied"
- [x] Dashboard exibe estatísticas do sistema
- [x] Lista de usuários renderiza tabela completa
- [x] Configurações do sistema exibem formulário
- [x] Error Boundary captura erros internos
- [x] Rotas internas (/admin/users, /admin/settings) funcionam
- [x] Shared dependencies são consumidas do Host
