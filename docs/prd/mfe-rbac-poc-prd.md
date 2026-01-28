# Product Requirement Document (PRD)
## MFE RBAC POC - Micro-Frontends com Module Federation e Role-Based Access Control

**Versão:** 1.1
**Data:** 27 de Janeiro de 2026
**Status:** Draft
**Autor:** Tasso Gomes

---

## Visão Geral

Esta POC (Proof of Concept) tem como objetivo validar uma arquitetura **production-grade** de micro-frontends utilizando Module Federation com carregamento dinâmico baseado em RBAC (Role-Based Access Control). O foco é provar que é possível construir um sistema onde o carregamento de micro-frontends é controlado exclusivamente pelas permissões do usuário, garantindo que usuários não autorizados não consigam acessar determinadas funcionalidades em nenhum nível (frontend, backend ou network).

### Problema a Resolver

Aplicações monolíticas de grande escala enfrentam dificuldades de:
- **Manutenibilidade:** código interdependente dificulta evoluções independentes
- **Deploy Independente:** mudanças em uma funcionalidade exigem redeploy da aplicação inteira
- **Escalabilidade de Equipes:** múltiplas equipes trabalhando no mesmo monolito criam conflitos
- **Segurança Granular:** controlar acesso por funcionalidade em um monolito é complexo

Micro-frontends resolvem parte desses problemas, mas a maioria das implementações no mercado carrega todos os remotes no client-side, expondo funcionalidades que o usuário não deveria acessar.

### Solução Proposta

Arquitetura de micro-frontends com:
- **Carregamento dinâmico:** remotes são carregados apenas se o usuário tiver permissão
- **Manifest Service:** backend que retorna apenas remotes autorizados baseado em roles
- **Validação em múltiplas camadas:** Host, Backend e cada Remote validam permissões
- **OIDC com Keycloak:** autenticação e gestão centralizada de identidade

### Valor de Negócio

- **Segurança:** Remotes não autorizados nunca são carregados (validação no client-side, server-side e network-level)
- **Performance:** Carrega apenas o código necessário para cada perfil de usuário
- **Time-to-Market:** Equipes podem desenvolver e deployar independentemente
- **Experiência do Usuário:** Menu e navegação dinâmicos baseados no perfil

---

## Objetivos

### Objetivo Principal

Validar o fluxo completo de autenticação e autorização: **Autenticação (Keycloak OIDC) → RBAC (Manifest Service) → Carregamento Dinâmico de MFEs (Module Federation)**

### Objetivos Específicos

1. **Fluxo de Autenticação**
   - Integrar Keycloak como Identity Provider usando protocolo OIDC
   - Implementar login, logout e refresh de tokens
   - Extrair roles/claims do JWT token

2. **Carregamento Dinâmico**
   - Host App deve carregar apenas remotes autorizados
   - Menu de navegação gerado dinamicamente baseado no manifesto
   - Module Federation Runtime API (@module-federation/enhanced)

3. **Segurança Production-Grade**
   - Validação de tokens em todas as camadas (Host, Backend, Remotes)
   - Headers de segurança configurados (CSP, X-Frame-Options, etc.)
   - CORS whitelist no backend
   - Remotes validam tokens próprios (defesa em profundidade)

4. **Resiliência**
   - Error boundaries para falhas de carregamento
   - Retry mechanism para falhas de rede
   - Falha em um remote não deve quebrar o Host

### Critérios de Sucesso

| Categoria | Critério | Como Medir |
|-----------|----------|------------|
| **Funcional** | Usuário não autorizado NÃO consegue carregar remote | Network tab não deve mostrar request para remoteEntry.js |
| **Funcional** | Menu muda dinamicamente conforme role | Login com diferentes roles mostra menus distintos |
| **Funcional** | Token refresh funciona corretamente | Sessão permanece ativa após expiração do access_token |
| **Funcional** | Logout funciona em todos os remotes e host | Logout limpa tokens e redireciona para Keycloak |
| **Performance** | Carrega apenas remotes necessários | Network tab mostra apenas requests de remotes autorizados |
| **Performance** | Lazy loading funcional | Código do remote só é baixado ao navegar para a rota |
| **Segurança** | Remote Admin não carrega para usuário SALES | Tentativa de acesso retorna 401/403 |
| **Segurança** | Backend rejeita request sem token válido | POST /api/config/remotes retorna 401 sem header Authorization |
| **Resiliência** | Falha em um remote não quebra o Host | Error boundary exibe mensagem amigável |
| **Resiliência** | Retry mechanism funciona | Retry de request com falha após delay exponencial |

---

## Histórias de Usuário

### Personas

| Persona | Role | Descrição | Acessos |
|---------|------|-----------|---------|
| **Ana Admin** | ADMIN | Administradora do sistema, responsável por gestão de usuários e configurações | Todos os remotes (Admin, Sales, User) |
| **Carlos Sales** | SALES | Gerente comercial, precisa de relatórios de vendas | Sales, User |
| **João User** | USER | Usuário comum, acessa apenas conteúdo geral | User apenas |

### Histórias de Usuário Detalhadas

#### EU-1: Login e Acesso Personalizado

**Como** usuário autenticado
**Eu quero** fazer login e ver apenas funcionalidades que tenho permissão
**Para que** eu não seja exposto a opções que não posso acessar

**Critérios de Aceitação:**
- [ ] Ao acessar a aplicação, sou redirecionado para tela de login do Keycloak
- [ ] Após login, sou redirecionado de volta para a Host App
- [ ] O menu lateral mostra apenas opções baseadas na minha role
- [ ] Ao clicar em uma opção do menu, sou levado para o remote correspondente
- [ ] Se tentar acessar diretamente uma URL que não tenho permissão, vejo mensagem de acesso negado

**Cenários:**
- **Cenário 1 (Ana Admin):** Login com role ADMIN vê menu com 3 opções: Administração, Vendas, Meu Perfil
- **Cenário 2 (Carlos Sales):** Login com role SALES vê menu com 2 opções: Vendas, Meu Perfil
- **Cenário 3 (João User):** Login com role USER vê menu com 1 opção: Meu Perfil

#### EU-2: Dashboard de Administração

**Como** administrador do sistema
**Eu quero** acessar um dashboard completo de administração
**Para que** eu possa gerenciar usuários e configurações do sistema

**Critérios de Aceitação:**
- [ ] Admin Dashboard carrega apenas para usuários com role ADMIN
- [ ] Dashboard exibe lista de usuários do sistema
- [ ] Dashboard permite configurar parâmetros do sistema
- [ ] Usuário sem role ADMIN não consegue carregar o remote (network tab vazio)

#### EU-3: Dashboard de Vendas

**Como** gerente comercial
**Eu quero** acessar relatórios de vendas e métricas
**Para que** eu possa acompanhar o desempenho da equipe

**Critérios de Aceitação:**
- [ ] Sales Dashboard carrega para usuários com role SALES ou ADMIN
- [ ] Dashboard exibe gráficos de vendas por período
- [ ] Dashboard exibe ranking de vendedores
- [ ] Usuário com role USER não consegue carregar o remote

#### EU-4: Perfil de Usuário

**Como** usuário autenticado
**Eu quero** acessar meu perfil e informações pessoais
**Para que** eu possa gerenciar minhas informações

**Critérios de Aceitação:**
- [ ] User Dashboard carrega para qualquer usuário autenticado
- [ ] Exibe informações pessoais (nome, email, roles)
- [ ] Permite edição de informações básicas

#### EU-5: Logout Seguro

**Como** usuário autenticado
**Eu quero** fazer logout da aplicação
**Para que** minha sessão seja encerrada de forma segura

**Critérios de Aceitação:**
- [ ] Ao clicar em logout, sou redirecionado para o Keycloak
- [ ] Tokens são limpos da aplicação
- [ ] Sessão do Keycloak é encerrada
- [ ] Próximo login exige credenciais novamente

---

## Funcionalidades Principais

### F1: Host Application

**Descrição:** Aplicação host que funciona como shell/orquestrador dos micro-frontends. Responsável pelo fluxo de autenticação, carregamento dinâmico de remotes e navegação.

**Por que é importante:** É o ponto único de entrada e controle da aplicação, garantindo a consistência da experiência do usuário e a segurança do carregamento.

**Como funciona:**
1. Usuário acessa a aplicação
2. Host verifica se existe sessão válida
3. Se não, redireciona para Keycloak
4. Após login, recebe tokens (id_token, access_token, refresh_token)
5. Chama Manifest Service com access_token
6. Recebe lista de remotes autorizados
7. Inicializa Module Federation com os remotes
8. Renderiza menu e rotas dinamicamente

**Requisitos Funcionais:**
- RF-1.1: Host deve integrar com Keycloak via OIDC
- RF-1.2: Host deve armazenar tokens em memória (memory-only) para maior segurança, com silent refresh automático
- RF-1.3: Host deve implementar refresh automático de tokens antes da expiração
- RF-1.4: Host deve chamar POST /api/config/remotes com Authorization header
- RF-1.5: Host deve inicializar Module Federation Runtime API com remotes do manifesto
- RF-1.6: Host deve gerar rotas React Router dinamicamente baseado no manifesto
- RF-1.7: Host deve renderizar menu de navegação dinamicamente
- RF-1.8: Host deve implementar error boundaries para falhas de carregamento
- RF-1.9: Host deve implementar logout com redirect para Keycloak
- RF-1.10: Host deve prover contexto de autenticação para remotes via Context API + Event Bus
- RF-1.11: Host deve implementar retry para chamada ao Manifest Service (máximo 3 tentativas, backoff exponencial: 1s, 2s, 4s)
- RF-1.12: Host deve exibir mensagens de erro específicas para diferentes tipos de falha (rede, autenticação, autorização)

### F2: Manifest Service (Backend)

**Descrição:** API Node.js/Express que valida tokens JWT e retorna manifesto de remotes autorizados baseado nas roles do usuário.

**Por que é importante:** É a autoridade central que determina quais remotes cada usuário pode acessar, adicionando uma camada de segurança server-side.

**Como funciona:**
1. Recebe request POST com access_token no Authorization header
2. Valida assinatura, expiração e issuer do JWT
3. Extrai roles/claims do token
4. Consulta configuração de remotes disponíveis
5. Filtra remotes baseado nas roles do usuário
6. Retorna JSON com remotes autorizados e dados do usuário

**Requisitos Funcionais:**
- RF-2.1: Endpoint POST /api/config/remotes deve aceitar Authorization: Bearer {token}
- RF-2.2: Backend deve validar assinatura JWT com chave pública do Keycloak
- RF-2.3: Backend deve validar expiração (exp), issuer (iss) e audience (aud)
- RF-2.4: Backend deve extrair roles do token do Keycloak
- RF-2.5: Backend deve filtrar remotes baseado nas roles do usuário
- RF-2.6: Backend deve retornar HTTP 401 para token inválido ou expirado
- RF-2.7: Backend deve retornar HTTP 403 para usuário sem roles válidas
- RF-2.8: Backend deve implementar CORS com whitelist de origens permitidas
- RF-2.9: Backend deve implementar endpoint GET /health para health checks
- RF-2.10: Backend deve logar requests de manifesto para auditoria

### F3: Admin Remote (Micro-Frontend)

**Descrição:** Micro-frontend para administração do sistema, acessível apenas para usuários com role ADMIN.

**Por que é importante:** Demonstra isolamento de funcionalidades sensíveis e aplicação de RBAC no nível de micro-frontend.

**Como funciona:**
1. Host carrega remote via Module Federation
2. Remote recebe contexto de autenticação do Host
3. Remote valida token e roles próprias
4. Se válido, renderiza dashboard administrativo
5. Se inválido, renderiza "Access Denied"

**Requisitos Funcionais:**
- RF-3.1: Remote deve expor módulo ./AdminApp via Module Federation
- RF-3.2: Remote deve aceitar contexto de autenticação do Host
- RF-3.3: Remote deve validar role ADMIN própria antes de renderizar
- RF-3.4: Remote deve exibir "Access Denied" se usuário não tiver role ADMIN
- RF-3.5: Remote deve implementar lista de usuários do sistema
- RF-3.6: Remote deve implementar tela de configurações do sistema
- RF-3.7: Remote deve usar rota /admin/* no Host
- RF-3.8: Remote deve implementar error boundary interno

### F4: Sales Remote (Micro-Frontend)

**Descrição:** Micro-frontend para dashboard de vendas, acessível para usuários com role SALES ou ADMIN.

**Por que é importante:** Demonstra um remote acessível por múltiplas roles e conteúdo de negócio específico.

**Requisitos Funcionais:**
- RF-4.1: Remote deve expor módulo ./SalesApp via Module Federation
- RF-4.2: Remote deve validar role SALES ou ADMIN própria
- RF-4.3: Remote deve exibir dashboard com gráficos de vendas
- RF-4.4: Remote deve exibir ranking de vendedores
- RF-4.5: Remote deve usar rota /sales/* no Host
- RF-4.6: Remote deve implementar error boundary interno

### F5: User Remote (Micro-Frontend)

**Descrição:** Micro-frontend para perfil do usuário, acessível para qualquer usuário autenticado (independente da role específica).

**Por que é importante:** Funcionalidade base que todos os usuários autenticados devem ter acesso.

**Requisitos Funcionais:**
- RF-5.1: Remote deve expor módulo ./UserApp via Module Federation
- RF-5.2: Remote não exige role específica (apenas autenticação válida)
- RF-5.3: Remote deve exibir informações pessoais do usuário
- RF-5.4: Remote deve permitir edição de informações básicas
- RF-5.5: Remote deve usar rota /user/* no Host
- RF-5.6: Remote deve implementar error boundary interno

### F6: Dynamic Remote Loader

**Descrição:** Componente genérico que carrega remotes dinamicamente usando Module Federation Runtime API.

**Por que é importante:** Permite carregamento sob demanda de remotes, sem necessidade de rebuild do Host.

**Requisitos Funcionais:**
- RF-6.1: Loader deve aceitar configuração de remote (remoteName, remoteEntry, exposedModule)
- RF-6.2: Loader deve usar loadRemote() do @module-federation/enhanced
- RF-6.3: Loader deve implementar lazy loading
- RF-6.4: Loader deve implementar retry mechanism com exponential backoff (máximo 3 tentativas: 1s, 2s, 4s)
- RF-6.5: Loader deve implementar timeout configurável (padrão: 10 segundos)
- RF-6.6: Loader deve propagar erros para Error Boundary com mensagens específicas
- RF-6.7: Loader deve exibir loading state durante carregamento

### F7: Keycloak Integration

**Descrição:** Integração com Keycloak como Identity Provider usando protocolo OIDC.

**Por que é importante:** Centraliza gestão de identidade e autenticação, permitindo SSO com outras aplicações.

**Requisitos Funcionais:**
- RF-7.1: App deve configurar Keycloak client (client-id, realm)
- RF-7.2: App deve implementar Authorization Code Flow com PKCE
- RF-7.3: App deve trocar code por tokens (id_token, access_token, refresh_token)
- RF-7.4: App deve armazenar tokens em memória (memory-only)
- RF-7.5: App deve implementar silent refresh usando refresh_token
- RF-7.6: App deve implementar logout com redirect para Keycloak
- RF-7.7: Keycloak realm deve configurar roles (ADMIN, SALES, USER)
- RF-7.8: Keycloak realm deve configurar client com redirect URIs válidas

---

## Experiência do Usuário

### Jornada do Usuário

```
[Tela 1: Login Keycloak]
      |
      v
[Autenticação: usuário insere credenciais]
      |
      v
[Redirecionamento: Keycloak → Host App com code]
      |
      v
[Troca de code por tokens]
      |
      v
[Request ao Manifest Service com access_token]
      |
      v
[Manifesto recebido com remotes autorizados]
      |
      v
[Tela 2: Host App com Menu Dinâmico]
   ____|____
  |         |
  v         v
[Menu]   [Conteúdo]
 (dinâmico)
```

### Fluxo de Navegação

1. **Login Primeiro Acesso**
   - Usuário acessa https://host.mfe.local
   - É redirecionado para Keycloak login
   - Após credenciais válidas, redirecionado de volta
   - Menu exibe opções baseadas nas roles

2. **Navegação Entre Remotes**
   - Usuário clica em opção do menu
   - Host usa React Router para navegar
   - Dynamic Loader carrega remote sob demanda
   - Loading state exibido durante carregamento
   - Remote renderizado dentro do Host

3. **Acesso Negado**
   - Se usuário tentar acessar URL direta de remote não autorizado
   - Host valida se remote está no manifesto
   - Se não estiver, exibe "Access Denied"
   - Network tab não mostra request para remoteEntry.js

### UI/UX Considerações

| Elemento | Descrição |
|----------|-----------|
| **Menu Lateral** | Navegação principal, gerado dinamicamente baseado no manifesto. Deve incluir label e ícone para cada remote. |
| **Header** | Barra superior com logo, nome do usuário e botão de logout. |
| **Loading State** | Skeleton loader ou spinner durante carregamento de remotes. |
| **Error Boundary** | Mensagem amigável e opção de retry em caso de falha. |
| **Access Denied** | Tela explicativa quando usuário tenta acessar remote não autorizado. |
| **Responsive** | Layout deve funcionar em desktop e mobile (menu colapsível em mobile). |

### Requisitos de Acessibilidade

- ACR-1: Contraste de cores deve seguir WCAG AA (mínimo 4.5:1)
- ACR-2: Navegação por teclado deve funcionar (tab, enter, escape)
- ACR-3: Elementos interativos devem ter focus visível
- ACR-4: Menus devem ter aria-labels apropriados
- ACR-5: Mensagens de erro devem ser anunciadas por screen readers
- ACR-6: Loading states devem ter aria-live regions

---

## Restrições Técnicas de Alto Nível

### Stack Tecnológico (Não Negociável)

**Frontend:**
- Host App: React 18+ com Vite 5.x
- Remote Apps: React 18+ com Vite 5.x (3 remotes)
- Module Federation: @module-federation/enhanced (Runtime API)
- Roteamento: React Router v6
- OIDC: react-oidc-context ou oidc-client-ts
- Estado: Context API + Event Bus para auth

**Backend:**
- Node.js 20 LTS com TypeScript
- Express.js 4.x
- Validação de JWT: jsonwebtoken ou jwks-rsa
- CORS: cors (pacote npm)

**Autenticação:**
- Keycloak 24.x (docker container)
- Protocolo: OIDC (OpenID Connect)
- Token Format: JWT RS256

> **Nota sobre CSP:** O uso de `'unsafe-eval'` no Content-Security-Policy é necessário para o Module Federation funcionar corretamente, pois ele utiliza eval() para carregar módulos dinamicamente. Este é um trade-off de segurança documentado e aceito para esta POC.

### Requisitos de Segurança

| Camada | Requisito |
|--------|-----------|
| **Network** | RemoteEntry.js de remotes não autorizados nunca são solicitados |
| **Backend** | Validação de assinatura JWT com chave pública do Keycloak |
| **Host** | Tokens armazenados em memória (memory-only) |
| **Remotes** | Cada remote valida suas próprias roles/claims |
| **Headers** | CSP, X-Frame-Options, X-Content-Type-Options configurados |
| **CORS** | Whitelist de origens permitidas no backend |

### Metas de Performance

| Métrica | Meta |
|--------|------|
| **Time to Interactive (Host)** | < 3 segundos |
| **Remote First Paint** | < 2 segundos após navegação |
| **Manifest Response** | < 500ms |
| **Token Refresh** | < 1 segundo |
| **Bundle Size (Host)** | < 200KB gzipped |

### Compatibilidade

| Plataforma | Suporte |
|------------|---------|
| **Browsers** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| **Mobile** | iOS Safari 14+, Chrome Android 90+ |
| **Screen Size** | Desktop (1024px+), Tablet (768px+), Mobile (320px+) |

---

## Não-Objetivos (Fora de Escopo)

Esta POC NÃO inclui:

- **Deploy em Ambiente Cloud:** Deploy em Vercel, AWS, Azure ou GCP não está no escopo
- **CI/CD Pipeline:** Configuração de GitHub Actions, GitLab CI ou similar
- **Monitoring e Observabilidade:** Integração com DataDog, New Relic, Sentry ou similar
- **Testes E2E Automatizados:** Playwright ou Cypress para testes end-to-end
- **Service Workers:** Cache avançado com PWA techniques
- **i18n:** Internacionalização e localização
- **Theming:** Sistema de temas (dark/light mode)
- **Analytics:** Telemetria e analíticas de uso
- **Performance Monitoring:** RUM (Real User Monitoring)
- **Load Testing:** Testes de carga e estresse
- **Segurança Avançada:** Rate limiting, DDoS protection, WAF
- **Documentação de API:** Swagger/OpenAPI para Manifest Service
- **Design System:** Biblioteca de componentes compartilhada entre remotes

### Futuras Considerações (Fora desta POC)

- Shared dependencies entre remotes
- Version control de remotes
- A/B testing de remotes
- Feature flags por remote
- Canary deployments de remotes

---

## Estrutura de Dados

### Manifest Response (Backend → Host)

```json
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
    {
      "remoteName": "sales_app",
      "remoteEntry": "https://sales.mfe.local/remoteEntry.js",
      "exposedModule": "./SalesApp",
      "routePath": "/sales",
      "navigationLabel": "Vendas",
      "requiredRoles": ["SALES", "ADMIN"],
      "icon": "chart",
      "version": "1.0.0"
    },
    {
      "remoteName": "user_app",
      "remoteEntry": "https://user.mfe.local/remoteEntry.js",
      "exposedModule": "./UserApp",
      "routePath": "/user",
      "navigationLabel": "Meu Perfil",
      "requiredRoles": [],
      "icon": "user",
      "version": "1.0.0"
    }
  ],
  "user": {
    "sub": "user-id-123",
    "name": "João Silva",
    "email": "joao@corp.com",
    "preferred_username": "jsilva",
    "roles": ["USER"]
  }
}
```

> **Nota:** O `user_app` tem `requiredRoles: []` pois qualquer usuário autenticado pode acessá-lo, independente da role específica.

### Keycloak JWT Token Structure (Access Token)

```json
{
  "exp": 1706400000,
  "iat": 1706396400,
  "auth_time": 1706396400,
  "jti": "token-id-123",
  "iss": "https://keycloak.local/realms/mfe-poc",
  "aud": ["mfe-host-client"],
  "sub": "user-id-123",
  "typ": "Bearer",
  "azp": "mfe-host-client",
  "acr": "1",
  "realm_access": {
    "roles": ["USER"]
  },
  "resource_access": {
    "mfe-host-client": {
      "roles": ["USER"]
    }
  },
  "scope": "openid profile email",
  "email_verified": true,
  "name": "João Silva",
  "preferred_username": "jsilva",
  "given_name": "João",
  "family_name": "Silva",
  "email": "joao@corp.com"
}
```

### Role Mapping

| Role | Descrição | Remotes Autorizados |
|------|-----------|---------------------|
| **ADMIN** | Administrador do sistema | Admin, Sales, User |
| **SALES** | Gerente comercial | Sales, User |
| **USER** | Usuário comum (padrão) | User |
| **Qualquer (autenticado)** | Qualquer usuário autenticado | User |

> **Nota:** O User Remote é acessível para qualquer usuário autenticado, independente de ter role ADMIN, SALES ou USER. A única exigência é estar autenticado.

---

## Security Headers

### Response Headers (Host e Remotes)

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://keycloak.local https://api.mfe.local; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

> **Aviso de Segurança:** O uso de `'unsafe-eval'` e `'unsafe-inline'` no CSP é necessário para o funcionamento do Module Federation. Em produção, considere avaliar alternativas como nonces ou hashes para scripts inline.

### CORS Configuration (Backend)

```typescript
const allowedOrigins = [
  'http://localhost:5173',  // Host dev
  'https://host.mfe.local'  // Host prod
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Authorization', 'Content-Type']
}));
```

---

## Deliverables

### Código

| Deliverable | Descrição |
|-------------|-----------|
| **Host App** | React + Vite com OIDC, Dynamic Loader, Menu Dinâmico |
| **Admin Remote** | React + Vite com dashboard administrativo |
| **Sales Remote** | React + Vite com dashboard de vendas |
| **User Remote** | React + Vite com perfil de usuário |
| **Backend API** | Node.js + Express + TypeScript com Manifest Service |
| **Keycloak Config** | Realm export JSON com clients, roles, users |

### Documentação

| Deliverable | Descrição |
|-------------|-----------|
| **README** | Setup completo e como rodar localmente |
| **Arquitetura** | Diagrama da arquitetura e fluxo de dados |
| **ADR** | Architecture Decision Records para escolhas técnicas |
| **Guia Keycloak** | Como configurar Keycloak realm |
| **Checklist Testes** | Validação manual da POC |

### Testes

| Deliverable | Descrição |
|-------------|-----------|
| **Script Automatizado** | Teste do fluxo completo (login → manifesto → navegação) |
| **Instruções Manuais** | Passo a passo para validação |
| **Checklist** | Lista de verificação de critérios de sucesso |

---

## Decisões Arquiteturais

### D1: Estrutura de Diretórios do Monorepo

**Decisão:** Cada projeto deve ser criado em sua respectiva pasta na raiz do repositório.

> **IMPORTANTE:** A estrutura de pastas segue o padrão abaixo. Cada projeto (host, backend, remotes) deve ser criado diretamente na raiz do repositório, em sua pasta dedicada.

```
mfe-dinamico/
├── host/                     # Host Application (React + Vite)
├── backend/                  # Backend API - Manifest Service (Node.js + Express)
├── admin-remote/             # Admin Remote - requer role ADMIN
├── sales-remote/             # Sales Remote - requer role SALES ou ADMIN
├── user-remote/              # User Remote - todos os autenticados
├── shared/                   # Tipos e código compartilhado
├── infrastructure/           # Docker, Keycloak configs
└── docs/                     # Documentação
```

**Justificativa:** Separação clara facilita deploy independente e ownership por equipes diferentes. Cada pasta é um projeto independente com seu próprio `package.json`.

### D2: Estratégia de Deploy Local

**Decisão:** Docker Compose para todos os serviços inclusive Keycloak.

**Justificativa:** Garante consistência entre ambientes de desenvolvimento e facilita onboarding de novos desenvolvedores.

### D3: Formato do Keycloak Realm Export

**Decisão:** JSON export + instruções para import via Admin UI.

**Justificativa:** Formato mais simples e portável, sem dependência de ferramentas externas como Terraform.

### D4: Estratégia de Token Storage

**Decisão:** Memory-only com silent refresh automático.

**Justificativa:** Mais seguro que localStorage (vulnerável a XSS). Silent refresh mantém sessão ativa sem exigir re-login.

### D5: Compartilhamento de Contexto de Auth

**Decisão:** Context API + Event Bus customizado.

**Justificativa:** Context API para estado compartilhado, Event Bus para comunicação assíncrona entre Host e Remotes (ex: notificar logout).

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|----------|
| Module Federation incompatibilidade entre versões | Baixa | Alto | Lock de versões exatas do Vite e plugin |
| CORS issues em local development | Média | Médio | Configurar CORS corretamente no backend |
| Keycloak setup complexo | Média | Médio | Docker Compose pré-configurado com realm import |
| Token refresh race conditions | Baixa | Alto | Implementar mutex para refresh |
| Remote load failures | Média | Médio | Retry com exponential backoff (max 3, delays: 1s, 2s, 4s) |
| JWT validation performance | Baixa | Baixo | Cache de public key (JWKS) com TTL de 1 hora |

---

## Aprovações

| Role | Nome | Status | Data |
|------|------|--------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Security | | | |

---

## Histórico de Mudanças

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | 27/01/2026 | Tassio Gomes | Versão inicial do PRD |
| 1.1 | 27/01/2026 | Tassio Gomes | Correções de encoding UTF-8, alinhamento de decisões arquiteturais com RFs, especificação de versões de tecnologias, detalhamento de retry/error handling |
