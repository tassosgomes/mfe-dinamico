---
status: pending
parallelizable: true
blocked_by: ["5.0"]
---

<task_context>
<domain>sales-remote</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>react, vite, @module-federation/enhanced</dependencies>
<unblocks>"9.0"</unblocks>
</task_context>

# Tarefa 7.0: Sales Remote (Micro-Frontend)

## Visão Geral

Implementar o micro-frontend Sales Remote, acessível para usuários com role SALES ou ADMIN. Este remote demonstra um MFE acessível por múltiplas roles e exibe conteúdo de negócio específico com gráficos de vendas e ranking de vendedores.

## Requisitos

<requirements>
- RF-4.1: Remote deve expor módulo ./SalesApp via Module Federation
- RF-4.2: Remote deve validar role SALES ou ADMIN própria
- RF-4.3: Remote deve exibir dashboard com gráficos de vendas
- RF-4.4: Remote deve exibir ranking de vendedores
- RF-4.5: Remote deve usar rota /sales/* no Host
- RF-4.6: Remote deve implementar error boundary interno
</requirements>

## Subtarefas

- [ ] 7.1 Criar estrutura de diretórios `sales-remote/`
- [ ] 7.2 Inicializar projeto Vite + React + TypeScript
- [ ] 7.3 Instalar @module-federation/enhanced
- [ ] 7.4 Configurar Module Federation no vite.config.ts (expor ./SalesApp)
- [ ] 7.5 Criar `src/guards/RoleGuard.tsx` para validação de roles SALES/ADMIN
- [ ] 7.6 Criar `src/components/AccessDenied.tsx` para acesso negado
- [ ] 7.7 Criar `src/components/ErrorBoundary.tsx` para erros internos
- [ ] 7.8 Criar `src/pages/Dashboard.tsx` com visão geral de vendas
- [ ] 7.9 Criar `src/components/SalesChart.tsx` com gráfico de vendas
- [ ] 7.10 Criar `src/components/RankingTable.tsx` com ranking de vendedores
- [ ] 7.11 Criar `src/pages/Reports.tsx` com relatórios detalhados
- [ ] 7.12 Criar `src/App.tsx` com rotas internas do remote
- [ ] 7.13 Criar `src/main.tsx` para desenvolvimento standalone
- [ ] 7.14 Configurar shared dependencies (react, react-dom, react-router-dom)
- [ ] 7.15 Testar: remote inicia standalone em http://localhost:5175
- [ ] 7.16 Testar: módulo ./SalesApp é exposto corretamente
- [ ] 7.17 Testar: RoleGuard permite SALES e ADMIN
- [ ] 7.18 Testar: gráfico de vendas renderiza corretamente
- [ ] 7.19 Testar: ranking de vendedores exibe dados

## Sequenciamento

- **Bloqueado por:** 5.0 (Host Dynamic Loader)
- **Desbloqueia:** 9.0 (Integração E2E)
- **Paralelizável:** Sim, pode ser executada em paralelo com 6.0 e 8.0

## Detalhes de Implementação

### Estrutura de Diretórios
```
sales-remote/
├── src/
│   ├── components/
│   │   ├── AccessDenied.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── RankingTable.tsx
│   │   └── SalesChart.tsx
│   ├── guards/
│   │   └── RoleGuard.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   └── Reports.tsx
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
      name: 'sales_app',
      filename: 'remoteEntry.js',
      exposes: {
        './SalesApp': './src/App.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
      },
    }),
  ],
  server: {
    port: 5175,
    cors: true,
  },
  build: {
    target: 'esnext',
  },
});
```

### Role Guard (RoleGuard.tsx)
```typescript
import { RemoteAppProps, Role } from '@shared/types';

interface RoleGuardProps extends RemoteAppProps {
  requiredRoles: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ authContext, requiredRoles, children }: RoleGuardProps) {
  const userRoles = authContext.user?.roles || [];
  
  // Verifica se usuário tem pelo menos uma das roles requeridas
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

export default function SalesApp({ authContext, basename }: RemoteAppProps) {
  return (
    <RoleGuard authContext={authContext} requiredRoles={['SALES', 'ADMIN']}>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route index element={<Dashboard authContext={authContext} />} />
          <Route path="reports" element={<Reports authContext={authContext} />} />
        </Routes>
      </BrowserRouter>
    </RoleGuard>
  );
}
```

### Sales Chart (SalesChart.tsx)
```typescript
// Dados mock para POC - Gráfico simples com CSS/SVG
const mockSalesData = [
  { month: 'Jan', value: 12000 },
  { month: 'Fev', value: 15000 },
  { month: 'Mar', value: 18000 },
  { month: 'Abr', value: 14000 },
  { month: 'Mai', value: 22000 },
  { month: 'Jun', value: 19000 },
];

export function SalesChart() {
  const maxValue = Math.max(...mockSalesData.map(d => d.value));
  
  return (
    <div className="sales-chart">
      <h3>Vendas por Mês</h3>
      <div className="chart-container">
        {mockSalesData.map(data => (
          <div key={data.month} className="chart-bar">
            <div 
              className="bar" 
              style={{ height: `${(data.value / maxValue) * 100}%` }}
            />
            <span className="label">{data.month}</span>
            <span className="value">R$ {data.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Ranking Table (RankingTable.tsx)
```typescript
// Dados mock para POC
const mockRanking = [
  { position: 1, name: 'Maria Silva', sales: 45000, deals: 12 },
  { position: 2, name: 'Pedro Santos', sales: 38000, deals: 10 },
  { position: 3, name: 'Ana Costa', sales: 32000, deals: 8 },
  { position: 4, name: 'Lucas Oliveira', sales: 28000, deals: 7 },
  { position: 5, name: 'Julia Ferreira', sales: 25000, deals: 6 },
];

export function RankingTable() {
  return (
    <div className="ranking-container">
      <h3>Ranking de Vendedores</h3>
      <table className="ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Vendedor</th>
            <th>Vendas (R$)</th>
            <th>Negócios</th>
          </tr>
        </thead>
        <tbody>
          {mockRanking.map(seller => (
            <tr key={seller.position} className={`rank-${seller.position}`}>
              <td>
                <span className="position-badge">{seller.position}</span>
              </td>
              <td>{seller.name}</td>
              <td>R$ {seller.sales.toLocaleString()}</td>
              <td>{seller.deals}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Dashboard (Dashboard.tsx)
```typescript
export function Dashboard({ authContext }: { authContext: AuthContext }) {
  return (
    <div className="sales-dashboard">
      <h1>Dashboard de Vendas</h1>
      <p>Bem-vindo, {authContext.user?.name}</p>
      
      <div className="dashboard-grid">
        <div className="card">
          <SalesChart />
        </div>
        <div className="card">
          <RankingTable />
        </div>
      </div>
      
      <nav className="sales-nav">
        <Link to="reports">Ver Relatórios Detalhados</Link>
      </nav>
    </div>
  );
}
```

## Critérios de Sucesso

- [ ] Remote inicia standalone em http://localhost:5175
- [ ] `remoteEntry.js` é gerado e acessível
- [ ] Módulo `./SalesApp` é exportado corretamente
- [ ] RoleGuard permite acesso para SALES e ADMIN
- [ ] Usuário USER vê "Access Denied"
- [ ] Dashboard exibe gráfico de vendas
- [ ] Ranking de vendedores renderiza tabela completa
- [ ] Rotas internas (/sales/reports) funcionam
- [ ] Error Boundary captura erros internos
- [ ] Shared dependencies são consumidas do Host
