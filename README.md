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
- 🧪 [Checklist de Validacao](./docs/testing/validation-checklist.md) - Fluxo completo de testes
- ⚠️ [Problemas Conhecidos](./docs/testing/known-issues.md) - Workarounds

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

# 2. Criar arquivo de ambiente
cp .env.example .env

# 3. Instalar dependências
for dir in backend host admin-remote sales-remote user-remote; do (cd "$dir" && npm install); done

# 4. Iniciar todos os serviços (Keycloak + apps)
./start-all.sh
```

### Alternativa: Docker Compose (todos os serviços)

```bash
docker compose up -d
```

### Portas e URLs

| Serviço | Porta | URL |
|---------|-------|-----|
| Keycloak | 8080 | http://localhost:8080 |
| Backend API | 3001 | http://localhost:3001 |
| Host App | 5173 | http://localhost:5173 |
| Admin Remote | 5174 | http://localhost:5174 |
| Sales Remote | 5175 | http://localhost:5175 |
| User Remote | 5176 | http://localhost:5176 |

Keycloak Admin Console: http://localhost:8080 (admin/admin)
Backend health check: http://localhost:3001/health

### Realm e usuários de teste

O realm é importado automaticamente a partir de [infrastructure/keycloak/realm-export.json](infrastructure/keycloak/realm-export.json).

| Usuário | Email | Senha | Role |
|---------|-------|-------|------|
| Ana | ana@corp.com | admin123 | ADMIN |
| Carlos | carlos@corp.com | sales123 | SALES |
| Joao | joao@corp.com | user123 | USER |

### Testar com Diferentes Roles

| Username | Password | Roles | Access |
|----------|----------|-------|--------|
| ana@corp.com | admin123 | ADMIN | Admin, Sales, User |
| carlos@corp.com | sales123 | SALES | Sales, User |
| joao@corp.com | user123 | USER | User |

---

## 📦 Estrutura do Projeto

```
mfe-dinamico/
├── host/                      # Host Application (Shell)
├── backend/                   # Backend API (Manifest Service)
├── admin-remote/              # Admin Dashboard Remote
├── sales-remote/              # Sales Dashboard Remote
├── user-remote/               # User Profile Remote
├── shared/                    # Shared types
├── infrastructure/            # Infra (Keycloak realm)
├── docs/                      # Documentacao
├── tasks/                     # Tarefas e PRD/Tech Spec
├── start-all.sh               # Script para iniciar tudo
├── docker-compose.yml         # Docker Compose (todos os servicos)
└── README.md                  # Este arquivo
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
- [x] Error boundaries nos remotes
- [x] Fluxo E2E completo validado

### 🚧 Em Progresso

- [ ] Logging e monitoring avançado
- [ ] Retry mechanism automático
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

## 🚀 Comandos Úteis

```bash
# Iniciar tudo localmente (Keycloak + apps)
./start-all.sh

# Iniciar stack via Docker Compose
docker compose up -d

# Iniciar apps manualmente (em terminais separados)
cd backend && npm run dev
cd host && npm run dev
cd admin-remote && npm run dev
cd sales-remote && npm run dev
cd user-remote && npm run dev
```

---

## 🧪 Testar a POC

Checklist completo de validacao:
[docs/testing/validation-checklist.md](docs/testing/validation-checklist.md)

Problemas conhecidos e workarounds:
[docs/testing/known-issues.md](docs/testing/known-issues.md)

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

**Status da POC:** ✅ Funcional (E2E Validado)
**Última Atualização:** 28 de Janeiro de 2026
