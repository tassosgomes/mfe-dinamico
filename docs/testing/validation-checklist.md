# Checklist de Validacao - MFE RBAC POC

## Ambiente de Teste

- Sistema: Linux/macOS/Windows
- Node.js: >= 18
- Docker + Docker Compose
- Navegador: Chrome 90+ (recomendado para medir performance)

## Preparacao

1. Copie o arquivo `.env.example` para `.env` e ajuste se necessario.
2. Instale as dependencias de cada app (host, backend e remotes).
3. Inicie os servicos:
   - Opcao A: `./start-all.sh`
   - Opcao B:
     - `docker compose up -d keycloak`
     - `cd backend && npm run dev`
     - `cd host && npm run dev`
     - `cd admin-remote && npm run dev`
     - `cd sales-remote && npm run dev`
     - `cd user-remote && npm run dev`

## Checklist de Autenticacao

- [ ] Login redireciona para Keycloak
- [ ] Callback processa tokens corretamente
- [ ] Usuario autenticado aparece no header
- [ ] Logout limpa sessao e redireciona
- [ ] Silent refresh funciona (verificar apos 4 minutos)

## RBAC - Usuario ADMIN (ana@corp.com)

- [ ] Menu exibe: Administracao, Vendas, Meu Perfil
- [ ] Admin Remote carrega em `/admin`
- [ ] Sales Remote carrega em `/sales`
- [ ] User Remote carrega em `/user`
- [ ] Network tab: `remoteEntry.js` de todos os remotes

## RBAC - Usuario SALES (carlos@corp.com)

- [ ] Menu exibe: Vendas, Meu Perfil
- [ ] Sales Remote carrega em `/sales`
- [ ] User Remote carrega em `/user`
- [ ] Network tab: nao ha request para admin `remoteEntry.js`
- [ ] Acesso direto a `/admin` mostra Access Denied

## RBAC - Usuario USER (joao@corp.com)

- [ ] Menu exibe: Meu Perfil
- [ ] User Remote carrega em `/user`
- [ ] Network tab: nao ha request para admin ou sales `remoteEntry.js`
- [ ] Acesso direto a `/admin` ou `/sales` mostra Access Denied

## Carregamento Dinamico

- [ ] Admin Remote carrega apenas para ADMIN
- [ ] Sales Remote carrega para SALES e ADMIN
- [ ] User Remote carrega para todos autenticados
- [ ] Lazy loading: codigo do remote so baixa ao navegar
- [ ] Error boundary exibe mensagem amigavel
- [ ] Retry funciona apos falha de rede

## Resiliencia

- [ ] Falha em um remote nao quebra o Host
- [ ] Loading state aparece durante carregamento

## Performance

- [ ] Time to Interactive do Host < 3s (DevTools > Lighthouse/Performance)
- [ ] Remote first paint < 2s apos navegacao
- [ ] Manifest response < 500ms (Network > POST /api/config/remotes)

## Evidencias (Network Tab)

Para cada teste de acesso negado:
1. Filtrar por "remoteEntry"
2. Verificar que nao ha request para o remote nao autorizado
3. Capturar screenshot e anexar ao registro de testes
