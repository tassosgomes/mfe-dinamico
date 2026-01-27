---
status: pending
parallelizable: true
blocked_by: ["5.0"]
---

<task_context>
<domain>apps/user-remote</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>react, vite, @module-federation/enhanced</dependencies>
<unblocks>"9.0"</unblocks>
</task_context>

# Tarefa 8.0: User Remote (Micro-Frontend)

## Visão Geral

Implementar o micro-frontend User Remote, acessível para qualquer usuário autenticado (independente da role específica). Este remote demonstra a funcionalidade base que todos os usuários autenticados devem ter acesso, incluindo visualização e edição do perfil.

## Requisitos

<requirements>
- RF-5.1: Remote deve expor módulo ./UserApp via Module Federation
- RF-5.2: Remote não exige role específica (apenas autenticação válida)
- RF-5.3: Remote deve exibir informações pessoais do usuário
- RF-5.4: Remote deve permitir edição de informações básicas
- RF-5.5: Remote deve usar rota /user/* no Host
- RF-5.6: Remote deve implementar error boundary interno
</requirements>

## Subtarefas

- [ ] 8.1 Criar estrutura de diretórios `apps/user-remote/`
- [ ] 8.2 Inicializar projeto Vite + React + TypeScript
- [ ] 8.3 Instalar @module-federation/enhanced
- [ ] 8.4 Configurar Module Federation no vite.config.ts (expor ./UserApp)
- [ ] 8.5 Criar `src/components/ErrorBoundary.tsx` para erros internos
- [ ] 8.6 Criar `src/pages/Profile.tsx` com informações do usuário
- [ ] 8.7 Criar `src/components/UserInfo.tsx` com display de dados
- [ ] 8.8 Criar `src/pages/EditProfile.tsx` para edição de perfil
- [ ] 8.9 Criar `src/components/ProfileForm.tsx` com formulário
- [ ] 8.10 Criar `src/App.tsx` com rotas internas do remote
- [ ] 8.11 Criar `src/main.tsx` para desenvolvimento standalone
- [ ] 8.12 Configurar shared dependencies (react, react-dom, react-router-dom)
- [ ] 8.13 Testar: remote inicia standalone em http://localhost:5176
- [ ] 8.14 Testar: módulo ./UserApp é exposto corretamente
- [ ] 8.15 Testar: qualquer usuário autenticado pode acessar
- [ ] 8.16 Testar: informações do perfil são exibidas corretamente
- [ ] 8.17 Testar: formulário de edição funciona

## Sequenciamento

- **Bloqueado por:** 5.0 (Host Dynamic Loader)
- **Desbloqueia:** 9.0 (Integração E2E)
- **Paralelizável:** Sim, pode ser executada em paralelo com 6.0 e 7.0

## Detalhes de Implementação

### Estrutura de Diretórios
```
apps/user-remote/
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   ├── ProfileForm.tsx
│   │   └── UserInfo.tsx
│   ├── pages/
│   │   ├── EditProfile.tsx
│   │   └── Profile.tsx
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
      name: 'user_app',
      filename: 'remoteEntry.js',
      exposes: {
        './UserApp': './src/App.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
      },
    }),
  ],
  server: {
    port: 5176,
    cors: true,
  },
  build: {
    target: 'esnext',
  },
});
```

### App.tsx (Ponto de entrada do remote)
```typescript
import { RemoteAppProps } from '@shared/types';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function UserApp({ authContext, basename }: RemoteAppProps) {
  // Não precisa de RoleGuard - qualquer usuário autenticado pode acessar
  // A verificação de autenticação é feita pelo Host
  
  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route index element={<Profile authContext={authContext} />} />
          <Route path="edit" element={<EditProfile authContext={authContext} />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

### User Info (UserInfo.tsx)
```typescript
import { UserProfile } from '@shared/types';

interface UserInfoProps {
  user: UserProfile;
}

export function UserInfo({ user }: UserInfoProps) {
  return (
    <div className="user-info">
      <div className="avatar">
        <span className="avatar-initials">
          {user.name.split(' ').map(n => n[0]).join('')}
        </span>
      </div>
      
      <dl className="info-list">
        <dt>Nome Completo</dt>
        <dd>{user.name}</dd>
        
        <dt>Email</dt>
        <dd>{user.email}</dd>
        
        <dt>Nome de Usuário</dt>
        <dd>{user.preferred_username}</dd>
        
        <dt>ID do Usuário</dt>
        <dd className="user-id">{user.sub}</dd>
        
        <dt>Permissões</dt>
        <dd>
          <div className="roles-list">
            {user.roles.map(role => (
              <span key={role} className={`role-badge role-${role.toLowerCase()}`}>
                {role}
              </span>
            ))}
          </div>
        </dd>
      </dl>
    </div>
  );
}
```

### Profile Page (Profile.tsx)
```typescript
import { AuthContext } from '@shared/types';
import { UserInfo } from '../components/UserInfo';
import { Link } from 'react-router-dom';

interface ProfileProps {
  authContext: AuthContext;
}

export function Profile({ authContext }: ProfileProps) {
  const { user } = authContext;
  
  if (!user) {
    return <div>Carregando...</div>;
  }
  
  return (
    <div className="profile-page">
      <h1>Meu Perfil</h1>
      
      <UserInfo user={user} />
      
      <div className="profile-actions">
        <Link to="edit" className="btn btn-primary">
          Editar Perfil
        </Link>
      </div>
    </div>
  );
}
```

### Profile Form (ProfileForm.tsx)
```typescript
import { useState } from 'react';
import { UserProfile } from '@shared/types';

interface ProfileFormProps {
  user: UserProfile;
  onSave: (data: Partial<UserProfile>) => void;
  onCancel: () => void;
}

export function ProfileForm({ user, onSave, onCancel }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Nome Completo</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      
      <div className="form-group readonly">
        <label>Nome de Usuário</label>
        <input type="text" value={user.preferred_username} disabled />
        <small>O nome de usuário não pode ser alterado</small>
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          Salvar Alterações
        </button>
      </div>
    </form>
  );
}
```

### Edit Profile Page (EditProfile.tsx)
```typescript
import { AuthContext } from '@shared/types';
import { ProfileForm } from '../components/ProfileForm';
import { useNavigate } from 'react-router-dom';

interface EditProfileProps {
  authContext: AuthContext;
}

export function EditProfile({ authContext }: EditProfileProps) {
  const { user } = authContext;
  const navigate = useNavigate();
  
  if (!user) {
    return <div>Carregando...</div>;
  }
  
  const handleSave = (data: Partial<UserProfile>) => {
    // Na POC, apenas simula o salvamento
    console.log('Dados salvos:', data);
    alert('Perfil atualizado com sucesso! (simulado)');
    navigate('/user');
  };
  
  const handleCancel = () => {
    navigate('/user');
  };
  
  return (
    <div className="edit-profile-page">
      <h1>Editar Perfil</h1>
      
      <ProfileForm 
        user={user} 
        onSave={handleSave} 
        onCancel={handleCancel} 
      />
    </div>
  );
}
```

## Critérios de Sucesso

- [ ] Remote inicia standalone em http://localhost:5176
- [ ] `remoteEntry.js` é gerado e acessível
- [ ] Módulo `./UserApp` é exportado corretamente
- [ ] Qualquer usuário autenticado pode acessar (ADMIN, SALES, USER)
- [ ] Informações do perfil são exibidas corretamente
- [ ] Roles do usuário são exibidas com badges
- [ ] Formulário de edição funciona
- [ ] Rotas internas (/user/edit) funcionam
- [ ] Error Boundary captura erros internos
- [ ] Shared dependencies são consumidas do Host
