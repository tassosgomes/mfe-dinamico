# MFE RBAC POC

**Proof of Concept (POC)** de micro-frontends com Module Federation e Role-Based Access Control (RBAC) usando Keycloak.

[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## 📋 Visão Geral

Esta POC valida uma arquitetura **production-grade** de micro-frontends onde:

1. **Autenticação OIDC com Keycloak** - Login centralizado
2. **RBAC Server-Side** - Backend filtra remotes baseado em roles
3. **Carregamento Dinâmico** - Apenas remotes autorizados são carregados
4. **Defense in Depth** - Validação de permissões em múltiplas camadas

### 🎯 Problema Resolvido

Implementações tradicionais de Module Federation carregam **todos** os remotes no client-side, expondo funcionalidades que o usuário não deveria acessar.

Esta POC demonstra que é possível carregar **apenas** os remotes que o usuário tem permissão, garantindo:

- ✅ **Segurança:** RemoteEntry.js não autorizados nunca são solicitados
- ✅ **Performance:** Carrega apenas código necessário para cada perfil
- ✅ **Flexibilidade:** Remotes podem ser adicionados/removidos sem rebuild do Host

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser (Client)                       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Host Application                      │   │
│  │  - OIDC Login/Logout                                 │   │
│  │  - Dynamic Menu (based on user roles)                │   │
│  │  - Dynamic Remote Loader                             │   │
│  │  - React Router v6 (routes generated dynamically)    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│              ┌────────────┼────────────┐                    │
│              ▼            ▼            ▼                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Admin Remote │ │ Sales Remote │ │  User Remote │        │
│  │  (ADMIN)     │ │ (SALES/ADMIN)│ │  (All Users) │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (OIDC + JWT)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                       │
│                                                               │
│  ┌─────────────────────┐    ┌───────────────────────────┐  │
│  │   Keycloak Server   │    │   Backend API (Node.js)   │  │
│  │                     │    │                           │  │
│  │ - OIDC Provider     │    │ - POST /api/config/remotes│  │
│  │ - JWT RS256         │    │ - JWT Validation (JWKS)   │  │
│  │ - Role Management   │    │ - RBAC Filtering          │  │
│  └─────────────────────┘    └───────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Documentação completa:**
- 📄 [PRD](./docs/prd/mfe-rbac-poc-prd.md) - Product Requirements
- 🏗️ [System Architecture](./docs/architecture/system-architecture.md) - Arquitetura detalhada
- 📋 [ADR](./docs/architecture/adr.md) - Architecture Decision Records
- 🚀 [Development Setup](./docs/setup/development-setup.md) - Setup completo

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** >= 18.0.0
- **Docker** & Docker Compose
- **npm** >= 9.0.0

### Setup em 5 Minutos

```bash
# 1. Clonar o repositório
cd mfe-dinamico

# 2. Subir o Keycloak via Docker Compose
docker compose up -d

# 3. (Opcional) Forçar setup via script se o realm não foi importado
node infrastructure/keycloak/setup-script.js

# 4. Iniciar desenvolvimento (quando as apps existirem)
# ./scripts/dev.sh
```

### Acessar Aplicações

- **Host App:** http://localhost:5173
- **Keycloak Admin:** http://localhost:8080 (admin/admin)
- **Backend API:** http://localhost:3000/health

### Realm e usuários de teste

O realm é importado automaticamente a partir de [infrastructure/keycloak/realm-export.json](infrastructure/keycloak/realm-export.json)
com as seguintes roles e usuários:

| Usuário | Email | Senha | Role |
|---------|-------|-------|------|
| anadmin | ana@corp.com | admin123 | ADMIN |
| carlossales | carlos@corp.com | sales123 | SALES |
| joaouser | joao@corp.com | user123 | USER |

### Testar com Diferentes Roles

| Username | Password | Roles | Access |
|----------|----------|-------|--------|
| admin | admin123 | ADMIN | All remotes (Admin, Sales, User) |
| sales | sales123 | SALES | Sales + User |
| user | user123 | USER | User only |

---

## 📦 Estrutura do Projeto

```
mfe-dinamico/
├── apps/                      # Frontend Applications
│   ├── host/                  # Host Application (Shell)
│   ├── admin-remote/          # Admin Dashboard Remote
│   ├── sales-remote/          # Sales Dashboard Remote
│   └── user-remote/           # User Profile Remote
│
├── services/                  # Backend Services
│   └── backend-api/           # Node.js + Express
│       ├── src/routes/        # API routes
│       ├── src/services/      # Business logic
│       └── src/middleware/    # Auth, CORS, error handlers
│
├── infrastructure/            # Infra as Code
│   ├── docker/                # Docker Compose configs
│   ├── keycloak/              # Realm exports
│   └── nginx/                 # Production configs
│
├── shared/                    # Shared types & utilities
│   ├── types/                 # TypeScript types
│   └── utils/                 # Shared utilities
│
├── docs/                      # Documentation
│   ├── prd/                   # Product Requirements
│   ├── architecture/          # Architecture & ADRs
│   └── setup/                 # Setup guides
│
├── scripts/                   # Automation scripts
│   ├── setup.sh               # Initial setup
│   └── dev.sh                 # Start all services
│
└── README.md                  # (this file)
```

---

## 🔑 Segurança em Profundidade

### Camada 1: Network
- RemoteEntry.js de remotes não autorizados **nunca são solicitados**
- Host filtra no manifesto antes de registrar remotes

### Camada 2: Backend
- Validação completa de JWT (assinatura, expiração, issuer)
- Roles extraídas e validadas contra manifest
- HTTP 401/403 para tokens inválidos ou sem permissão

### Camada 3: Host
- Tokens armazenados em memória
- Silent refresh com refresh_token
- Manifest caching com revalidation

### Camada 4: Remotes
- Cada remote valida suas próprias roles
- Renderiza "Access Denied" se token inválido
- Defense in depth (não confia apenas no Host)

---

## 🎯 Funcionalidades

### ✅ Implementado

- [x] Keycloak OIDC integration
- [x] Backend Manifest Service com JWT validation
- [x] Host App com dynamic loading
- [x] 3 Remotes (Admin, Sales, User)
- [x] Dynamic menu based on user roles
- [x] Token storage in memory with silent refresh
- [x] CORS e security headers configured
- [x] Docker Compose orquestração

### 🚧 Em Progresso

- [ ] Error boundaries e retry mechanism
- [ ] Logging e monitoring
- [ ] Testes end-to-end
- [ ] Documentação de deploy

### 📅 Fora de Escopo

- CI/CD pipelines
- Cloud deployment (Vercel, AWS, etc)
- Service Workers / PWA
- Monitoring avançado (DataDog, Sentry)
- i18n / Theming

---

## 🔧 Stack Tecnológico

### Frontend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React | 18+ | UI Library |
| Vite | 5+ | Build Tool |
| Module Federation | Enhanced 2+ | Dynamic MFE loading |
| React Router | v6 | Roteamento |
| oidc-client-ts | Latest | OIDC client |

### Backend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Node.js | 18+ ou 20+ | Runtime |
| Express | 4.18+ | Web Framework |
| jsonwebtoken | 9+ | JWT validation |
| jwks-rsa | 3+ | JWKS client |
| TypeScript | 5+ | Type safety |

### Infrastructure
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Keycloak | 23+ | Identity Provider |
| Docker | 24+ | Containerization |
| Docker Compose | 2+ | Orchestration |

---

## 📊 Critérios de Sucesso

### Funcional
- ✅ Usuário não autorizado NÃO consegue carregar remote (network tab vazio)
- ✅ Menu muda dinamicamente conforme role
- ✅ Token refresh funciona corretamente
- ✅ Logout funciona em todos os remotes e host

### Performance
- ✅ Carrega apenas remotes necessários
- ✅ Lazy loading funcional
- ⏳ Time to Interactive < 3s
- ⏳ Remote First Paint < 2s

### Segurança
- ✅ Remote Admin não carrega para usuário SALES
- ✅ Backend rejeita request sem token válido
- ✅ CORS headers configurados corretamente

### Resiliência
- ⏳ Falha em um remote não quebra o Host
- ⏳ Error boundary exibe mensagem amigável
- ⏳ Retry mechanism funciona

---

## 📚 Documentação

### Principais Documentos

1. **[PRD](./docs/prd/mfe-rbac-poc-prd.md)** - Product Requirements Document completo
   - Objetivos e critérios de sucesso
   - Histórias de usuário detalhadas
   - Requisitos funcionais e não-funcionais

2. **[System Architecture](./docs/architecture/system-architecture.md)** - Arquitetura técnica
   - Diagramas de sequência
   - Detalhes de cada componente
   - Fluxo de autenticação e autorização

3. **[ADR](./docs/architecture/adr.md)** - Architecture Decision Records
   - 7 decisões arquiteturais documentadas
   - Alternativas consideradas
   - Trade-offs e consequências

4. **[Development Setup](./docs/setup/development-setup.md)** - Setup detalhado
   - Passo a passo da instalação
   - Configuração de ambiente
   - Troubleshooting

---

## 🚀 Scripts Disponíveis

```bash
# Instalar todas as dependências
npm run install:all

# Iniciar infraestrutura (Keycloak + Backend)
npm run dev:infra

# Iniciar Host App
npm run dev:host

# Iniciar Remotes (individualmente)
npm run dev:admin
npm run dev:sales
npm run dev:user

# Iniciar tudo (background)
npm run dev:all

# Build de todas as apps
npm run build:all

# Rodar testes
npm run test
```

---

## 🧪 Testar a POC

### Fluxo de Teste Manual

1. **Login como admin**
   - Acessar http://localhost:5173
   - Credenciais: admin / admin123
   - **Expectativa:** Menu com 3 opções (Admin, Vendas, Meu Perfil)

2. **Verificar Network Tab**
   - Abrir DevTools → Network
   - Verificar que `remoteEntry.js` dos 3 remotes foram carregados

3. **Navegar para Admin Dashboard**
   - Clicar em "Administração"
   - **Expectativa:** Dashboard carrega com sucesso

4. **Logout e Login como sales**
   - Fazer logout
   - Login: sales / sales123
   - **Expectativa:** Menu com 2 opções (Vendas, Meu Perfil)

5. **Verificar Network Tab Novamente**
   - **Expectativa:** Apenas 2 `remoteEntry.js` (sales e user)
   - **Expectativa:** Admin remoteEntry NÃO foi carregado

6. **Tentar Acessar Admin Diretamente**
   - Navegar para http://localhost:5173/admin
   - **Expectativa:** "Access Denied" ou redirecionamento

---

## 🤝 Contribuindo

Esta é uma POC, mas contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

[MIT](LICENSE) - Tassio Gomes

---

## 📞 Contato

Tassio Gomes - [@tassosgomes](https://github.com/tassosgomes)

---

**Status da POC:** Em Desenvolvimento
**Última Atualização:** 27 de Janeiro de 2026
