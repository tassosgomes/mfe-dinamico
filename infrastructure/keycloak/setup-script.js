const fs = require('fs');
const path = require('path');

const baseUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const adminUser = process.env.KEYCLOAK_ADMIN || 'admin';
const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const realmFilePath = path.join(__dirname, 'realm-export.json');

async function getAdminToken() {
  const tokenUrl = `${baseUrl}/realms/master/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: adminUser,
    password: adminPassword,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new Error(`Erro ao autenticar no Keycloak: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function realmExists(token, realmName) {
  const response = await fetch(`${baseUrl}/admin/realms/${realmName}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    throw new Error(`Erro ao consultar realm: ${response.status} ${response.statusText}`);
  }

  return true;
}

async function createRealm(token, realmPayload) {
  const response = await fetch(`${baseUrl}/admin/realms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(realmPayload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao criar realm: ${response.status} ${response.statusText} - ${text}`);
  }
}

async function main() {
  if (!fs.existsSync(realmFilePath)) {
    throw new Error(`Arquivo realm-export.json não encontrado em ${realmFilePath}`);
  }

  const realmPayload = JSON.parse(fs.readFileSync(realmFilePath, 'utf8'));
  const realmName = realmPayload.realm;

  if (!realmName) {
    throw new Error('Campo "realm" não encontrado no realm-export.json');
  }

  const token = await getAdminToken();
  const exists = await realmExists(token, realmName);

  if (exists) {
    console.log(`Realm "${realmName}" já existe. Nada a fazer.`);
    return;
  }

  await createRealm(token, realmPayload);
  console.log(`Realm "${realmName}" criado com sucesso.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
