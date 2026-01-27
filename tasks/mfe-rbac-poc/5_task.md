---
status: pending
parallelizable: false
blocked_by: ["3.0", "4.0"]
---

<task_context>
<domain>apps/host</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>@module-federation/enhanced, react-router-dom</dependencies>
<unblocks>"6.0", "7.0", "8.0"</unblocks>
</task_context>

# Tarefa 5.0: Host Application - Dynamic Remote Loader e Navegação

## Visão Geral

Implementar o carregamento dinâmico de remotes usando Module Federation Runtime API e a navegação dinâmica baseada no manifesto. Esta tarefa completa o Host Application, incluindo menu dinâmico, rotas dinâmicas, error boundaries e integração com o Manifest Service.

## Requisitos

<requirements>
- RF-1.4: Host deve chamar POST /api/config/remotes com Authorization header
- RF-1.5: Host deve inicializar Module Federation Runtime API com remotes do manifesto
- RF-1.6: Host deve gerar rotas React Router dinamicamente baseado no manifesto
- RF-1.7: Host deve renderizar menu de navegação dinamicamente
- RF-1.8: Host deve implementar error boundaries para falhas de carregamento
- RF-1.11: Host deve implementar retry para chamada ao Manifest Service (máximo 3 tentativas, backoff exponencial)
- RF-1.12: Host deve exibir mensagens de erro específicas para diferentes tipos de falha
- RF-6.1: Loader deve aceitar configuração de remote (remoteName, remoteEntry, exposedModule)
- RF-6.2: Loader deve usar loadRemote() do @module-federation/enhanced
- RF-6.3: Loader deve implementar lazy loading
- RF-6.4: Loader deve implementar retry mechanism com exponential backoff (máximo 3 tentativas)
- RF-6.5: Loader deve implementar timeout configurável (padrão: 10 segundos)
- RF-6.6: Loader deve propagar erros para Error Boundary com mensagens específicas
- RF-6.7: Loader deve exibir loading state durante carregamento
</requirements>

## Subtarefas

- [ ] 5.1 Instalar @module-federation/enhanced
- [ ] 5.2 Configurar Module Federation no vite.config.ts (como Host)
- [ ] 5.3 Criar `src/contexts/ManifestContext.tsx` para armazenar manifesto
- [ ] 5.4 Criar `src/services/manifest.service.ts` para chamar backend API
- [ ] 5.5 Implementar retry com exponential backoff no manifest service
- [ ] 5.6 Criar `src/loaders/DynamicRemoteLoader.tsx` usando Runtime API
- [ ] 5.7 Implementar lazy loading com React.lazy e Suspense
- [ ] 5.8 Implementar timeout configurável no loader (10s padrão)
- [ ] 5.9 Criar `src/components/ErrorBoundary.tsx` para erros de remote
- [ ] 5.10 Criar `src/components/Layout.tsx` com header e sidebar
- [ ] 5.11 Criar `src/components/Sidebar.tsx` com menu dinâmico
- [ ] 5.12 Criar `src/components/Header.tsx` com info do usuário e logout
- [ ] 5.13 Criar `src/components/LoadingSpinner.tsx` para loading states
- [ ] 5.14 Criar `src/pages/Home.tsx` como página inicial
- [ ] 5.15 Criar `src/pages/NotFound.tsx` para rotas não encontradas
- [ ] 5.16 Criar `src/pages/AccessDenied.tsx` para acesso negado
- [ ] 5.17 Atualizar `src/App.tsx` com rotas dinâmicas
- [ ] 5.18 Implementar lógica de inicialização do MF Runtime
- [ ] 5.19 Testar: menu exibe remotes baseado nas roles do usuário
- [ ] 5.20 Testar: navegação carrega remote dinamicamente
- [ ] 5.21 Testar: erro de carregamento exibe Error Boundary
- [ ] 5.22 Testar: retry funciona após falha de rede

## Sequenciamento

- **Bloqueado por:** 3.0 (Backend API), 4.0 (Host Auth)
- **Desbloqueia:** 6.0, 7.0, 8.0 (Remotes podem ser desenvolvidos em paralelo após esta tarefa)
- **Paralelizável:** Não

## Detalhes de Implementação

### Estrutura Adicional de Diretórios
```
apps/host/src/
├── components/
│   ├── ErrorBoundary.tsx
│   ├── Header.tsx
│   ├── Layout.tsx
│   ├── LoadingSpinner.tsx
│   └── Sidebar.tsx
├── contexts/
│   └── ManifestContext.tsx
├── loaders/
│   └── DynamicRemoteLoader.tsx
├── pages/
│   ├── AccessDenied.tsx
│   ├── Home.tsx
│   └── NotFound.tsx
└── services/
    └── manifest.service.ts
```

### Vite Config com Module Federation
```typescript
import { federation } from '@module-federation/enhanced/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {}, // Remotes serão carregados dinamicamente
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
      },
    }),
  ],
});
```

### Manifest Service (manifest.service.ts)
```typescript
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1s

export async function fetchManifest(accessToken: string): Promise<ManifestResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('/api/config/remotes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new ManifestError(response.status, await response.json());
      }
      
      return response.json();
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES - 1) {
        await delay(INITIAL_DELAY * Math.pow(2, attempt)); // Backoff exponencial
      }
    }
  }
  
  throw lastError;
}
```

### Dynamic Remote Loader (DynamicRemoteLoader.tsx)
```typescript
import { init, loadRemote } from '@module-federation/enhanced/runtime';

export function DynamicRemoteLoader({ remoteName, moduleName, fallback, errorComponent }: Props) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const { authContext } = useAuthContext();
  
  useEffect(() => {
    loadRemoteModule();
  }, [remoteName]);
  
  async function loadRemoteModule() {
    try {
      // Inicializar runtime com configuração do remote
      init({
        name: 'host',
        remotes: [{
          name: remoteName,
          entry: getRemoteEntry(remoteName),
        }],
      });
      
      // Carregar módulo com timeout
      const module = await Promise.race([
        loadRemote(`${remoteName}/${moduleName}`),
        timeout(10000),
      ]);
      
      setComponent(() => module.default);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBoundary error={error} />;
  if (!Component) return null;
  
  return <Component authContext={authContext} basename={getBasename(remoteName)} />;
}
```

### Menu Dinâmico (Sidebar.tsx)
```typescript
export function Sidebar() {
  const { manifest } = useManifestContext();
  
  return (
    <nav>
      <ul>
        {manifest?.remotes.map(remote => (
          <li key={remote.remoteName}>
            <NavLink to={remote.routePath}>
              <Icon name={remote.icon} />
              {remote.navigationLabel}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### Rotas Dinâmicas (App.tsx)
```typescript
function App() {
  const { manifest } = useManifestContext();
  
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        {manifest?.remotes.map(remote => (
          <Route
            key={remote.remoteName}
            path={`${remote.routePath}/*`}
            element={
              <DynamicRemoteLoader
                remoteName={remote.remoteName}
                moduleName={remote.exposedModule}
                routePath={remote.routePath}
              />
            }
          />
        ))}
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
```

## Critérios de Sucesso

- [ ] POST /api/config/remotes é chamado após login com Bearer token
- [ ] Manifesto é armazenado no ManifestContext
- [ ] Menu lateral exibe apenas remotes autorizados
- [ ] Clique no menu navega para rota correta
- [ ] Remote é carregado dinamicamente via Module Federation
- [ ] Loading spinner aparece durante carregamento
- [ ] Error Boundary captura erros de carregamento
- [ ] Retry funciona com backoff exponencial
- [ ] Timeout de 10s cancela carregamento lento
- [ ] Acesso direto a URL não autorizada mostra AccessDenied
- [ ] Rotas inexistentes mostram NotFound
- [ ] Layout responsivo funciona em desktop e mobile
