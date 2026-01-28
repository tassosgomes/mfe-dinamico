# Problemas Conhecidos e Workarounds

**Última Atualização:** 28 de Janeiro de 2026

---

## Problemas Resolvidos (v1.1)

### ✅ OIDC stateStore com InMemoryWebStorage
- **Sintoma:** Callback falhava com erro de state mismatch.
- **Causa:** `InMemoryWebStorage` perdia estado durante redirect.
- **Solução:** Alterado para `sessionStorage` em `host/src/auth/oidc-config.ts`.

### ✅ React StrictMode causando dupla execução no Callback
- **Sintoma:** `signinRedirectCallback` chamado duas vezes, causando erro.
- **Causa:** StrictMode no React 18 monta componentes duas vezes.
- **Solução:** Adicionado `useRef` guard em `host/src/pages/Callback.tsx`.

### ✅ Keycloak health check incorreto no start-all.sh
- **Sintoma:** Script falhava esperando Keycloak ficar ready.
- **Causa:** Endpoint `/health/ready` retornava objeto JSON, não string "ready".
- **Solução:** Alterado para verificar HTTP status 200 em `start-all.sh`.

### ✅ 404 em /api/config/remotes
- **Sintoma:** Host não conseguia obter manifesto do backend.
- **Causa:** Vite dev server não tinha proxy configurado para `/api`.
- **Solução:** Adicionado proxy em `host/vite.config.ts`.

### ✅ "Cannot use import statement outside a module"
- **Sintoma:** Remote entries falhavam ao carregar com erro de ES modules.
- **Causa:** Module Federation runtime precisava de `type: 'module'`.
- **Solução:** Adicionado `type: 'module'` em `backend/src/config/remotes.config.ts`.

### ✅ Roles não apareciam no token (mostrava "Nenhuma")
- **Sintoma:** Login funcionava mas roles sempre vazias.
- **Causa:** Keycloak não incluía `realm_access.roles` no ID token por padrão.
- **Solução:** Adicionado protocol mapper no `infrastructure/keycloak/realm-export.json`.

### ✅ "Cannot render Router inside another Router"
- **Sintoma:** Remotes falhavam ao renderizar com erro de Router aninhado.
- **Causa:** Remotes tinham seu próprio Router, conflitando com BrowserRouter do Host.
- **Solução:** Removido Router dos remotes, renderizam componente diretamente.

---

## Problemas Conhecidos (Pendentes)

### 1) Keycloak demora para ficar pronto
- **Sintoma:** Falha de login logo após subir o container.
- **Workaround:** O script `start-all.sh` já aguarda o endpoint de health.

### 2) Aviso de "eval" no build do Module Federation
- **Sintoma:** Aviso no build sobre uso de eval no pacote `@module-federation/sdk`.
- **Workaround:** Esperado para Module Federation Runtime; manter CSP com `unsafe-eval` em dev.

### 3) Docker Compose para frontends pode precisar de polling
- **Sintoma:** Hot reload não detecta alterações quando rodando dentro do container.
- **Workaround:** Variável `CHOKIDAR_USEPOLLING=true` já configurada no `docker-compose.yml`.

### 4) Cache do navegador mascara lazy loading
- **Sintoma:** remoteEntry parece sempre baixado.
- **Workaround:** Use aba Network em "Disable cache" e recarregue a página.

### 5) WebSocket errors do dynamic-remote-type-hints-plugin
- **Sintoma:** Erros de WebSocket no console durante desenvolvimento.
- **Causa:** Plugin de type hints tenta conectar em porta não disponível.
- **Impacto:** Apenas cosmético, não afeta funcionamento.
