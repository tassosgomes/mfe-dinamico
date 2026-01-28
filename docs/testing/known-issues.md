# Problemas Conhecidos e Workarounds

## 1) Keycloak demora para ficar pronto
- Sintoma: falha de login logo apos subir o container.
- Workaround: aguarde o endpoint `http://localhost:8080/health/ready` retornar 200 antes de testar.

## 2) Aviso de "eval" no build do Module Federation
- Sintoma: aviso no build sobre uso de eval no pacote `@module-federation/sdk`.
- Workaround: esperado para Module Federation Runtime; manter CSP com `unsafe-eval` em dev.

## 3) Docker Compose para frontends pode precisar de polling
- Sintoma: hot reload nao detecta alteracoes quando rodando dentro do container.
- Workaround: variavel `CHOKIDAR_USEPOLLING=true` ja configurada no `docker-compose.yml`.

## 4) Cache do navegador mascara lazy loading
- Sintoma: remoteEntry parece sempre baixado.
- Workaround: use aba Network em "Disable cache" e recarregue a pagina.
