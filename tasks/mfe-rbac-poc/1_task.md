---
status: pending
parallelizable: false
blocked_by: []
---

<task_context>
<domain>infra/docker</domain>
<type>configuration</type>
<scope>infrastructure</scope>
<complexity>medium</complexity>
<dependencies>docker, keycloak</dependencies>
<unblocks>"4.0"</unblocks>
</task_context>

# Tarefa 1.0: Configuração da Infraestrutura Base (Docker + Keycloak)

## Visão Geral

Configurar a infraestrutura base necessária para o projeto, incluindo Docker Compose para orquestração local e Keycloak como Identity Provider OIDC. Esta tarefa é fundamental pois estabelece o ambiente de desenvolvimento para todas as outras tarefas.

## Requisitos

<requirements>
- RF-7.7: Keycloak realm deve configurar roles (ADMIN, SALES, USER)
- RF-7.8: Keycloak realm deve configurar client com redirect URIs válidas
- Keycloak 24.x rodando em container Docker
- Realm "mfe-poc" configurado com client "mfe-host-client"
- Usuários de teste criados (Ana Admin, Carlos Sales, João User)
- Docker Compose funcional para orquestração local
</requirements>

## Subtarefas

- [ ] 1.1 Criar estrutura de diretórios `infrastructure/keycloak/` e `infrastructure/docker/`
- [ ] 1.2 Criar arquivo `docker-compose.yml` na raiz com serviço Keycloak
- [ ] 1.3 Criar script `infrastructure/keycloak/setup-script.js` para configuração automatizada
- [ ] 1.4 Criar arquivo `infrastructure/keycloak/realm-export.json` com configuração do realm
- [ ] 1.5 Configurar client "mfe-host-client" como Public Client com PKCE
- [ ] 1.6 Criar roles: ADMIN, SALES, USER no realm
- [ ] 1.7 Criar usuários de teste com roles atribuídas
- [ ] 1.8 Criar arquivo `.env.example` com variáveis de ambiente
- [ ] 1.9 Atualizar `README.md` com instruções de setup
- [ ] 1.10 Testar: `docker compose up` e verificar Keycloak acessível em http://localhost:8080

## Sequenciamento

- **Bloqueado por:** Nenhuma tarefa
- **Desbloqueia:** 4.0 (Host App Auth precisa do Keycloak rodando)
- **Paralelizável:** Sim, pode ser executada em paralelo com 2.0 (Tipos Compartilhados)

## Detalhes de Implementação

### Estrutura de Diretórios
```
infrastructure/
├── keycloak/
│   ├── realm-export.json
│   └── setup-script.js
└── docker/
    ├── docker-compose.yml
    └── .env.example
```

### Docker Compose (docker-compose.yml)
```yaml
version: '3.8'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
    ports:
      - "8080:8080"
    command: start-dev
    volumes:
      - ./infrastructure/keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json
```

### Configuração do Client Keycloak
- **Client ID:** mfe-host-client
- **Client Protocol:** openid-connect
- **Access Type:** public (com PKCE)
- **Valid Redirect URIs:** http://localhost:5173/*, http://localhost:5174/*
- **Web Origins:** http://localhost:5173, http://localhost:5174

### Usuários de Teste
| Usuário | Email | Senha | Role |
|---------|-------|-------|------|
| anadmin | ana@corp.com | admin123 | ADMIN |
| carlossales | carlos@corp.com | sales123 | SALES |
| joaouser | joao@corp.com | user123 | USER |

## Critérios de Sucesso

- [ ] `docker compose up` inicia Keycloak sem erros
- [ ] Console admin Keycloak acessível em http://localhost:8080/admin
- [ ] Realm "mfe-poc" existe e está configurado
- [ ] Client "mfe-host-client" existe com configuração correta
- [ ] Roles ADMIN, SALES, USER existem no realm
- [ ] Usuários de teste conseguem fazer login
- [ ] Endpoint de discovery OIDC responde: http://localhost:8080/realms/mfe-poc/.well-known/openid-configuration
