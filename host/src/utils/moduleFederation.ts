import { init } from '@module-federation/enhanced/runtime';
import type { RemoteConfig } from '@mfe/shared';

let initialized = false;
let currentHash = '';

function buildHash(remotes: RemoteConfig[]): string {
  return remotes
    .map((remote) => `${remote.remoteName}:${remote.remoteEntry}`)
    .sort()
    .join('|');
}

export function initializeFederation(remotes: RemoteConfig[]): void {
  if (remotes.length === 0) {
    return;
  }

  const hash = buildHash(remotes);
  if (initialized && hash === currentHash) {
    return;
  }

  init({
    name: 'host',
    remotes: remotes.map((remote) => ({
      name: remote.remoteName,
      entry: remote.remoteEntry,
    })),
  });

  initialized = true;
  currentHash = hash;
}
