import {
  InMemoryWebStorage,
  UserManagerSettings,
  WebStorageStateStore,
} from 'oidc-client-ts';

const authority =
  import.meta.env.VITE_KEYCLOAK_AUTHORITY ??
  'http://localhost:8080/realms/mfe-poc';
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'mfe-host-client';
const appBaseUrl = import.meta.env.VITE_APP_BASE_URL ?? 'http://localhost:5173';

export const oidcConfig: UserManagerSettings = {
  authority,
  client_id: clientId,
  redirect_uri: `${appBaseUrl}/callback`,
  post_logout_redirect_uri: appBaseUrl,
  silent_redirect_uri: `${appBaseUrl}/silent-renew.html`,
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  accessTokenExpiringNotificationTimeInSeconds: 60,
  userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
  stateStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
};
